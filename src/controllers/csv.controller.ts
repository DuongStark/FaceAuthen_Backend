import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

/**
 * Parse and import students from CSV text
 * POST /classes/:id/students/import-csv
 */
export const importStudentsFromCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { csvText } = req.body;

    if (!csvText) {
      return res.status(400).json({ error: 'CSV text is required' });
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Parse CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'No valid records found in CSV' });
    }

    // Validate CSV format
    const requiredColumns = ['studentId', 'name', 'email'];
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRecord));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}`,
        hint: 'CSV must have columns: studentId, name, email'
      });
    }

    // Bulk create students
    const createdStudents = await prisma.student.createMany({
      data: records.map((record: any) => ({
        classId: id,
        studentId: record.studentId,
        name: record.name,
        email: record.email,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      message: 'Students imported successfully',
      count: createdStudents.count,
      total: records.length,
    });
  } catch (error: any) {
    console.error('Import CSV error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
