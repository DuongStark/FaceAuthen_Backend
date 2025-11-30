import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Get all allowed IPs
 */
export const getAllowedIPs = async (req: Request, res: Response) => {
  try {
    const allowedIPs = await prisma.allowedIP.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: allowedIPs,
    });
  } catch (error) {
    console.error('Error getting allowed IPs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get allowed IPs',
    });
  }
};

/**
 * Get active allowed IPs only
 */
export const getActiveAllowedIPs = async (req: Request, res: Response) => {
  try {
    const allowedIPs = await prisma.allowedIP.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: allowedIPs,
    });
  } catch (error) {
    console.error('Error getting active allowed IPs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active allowed IPs',
    });
  }
};

/**
 * Get allowed IP by ID
 */
export const getAllowedIPById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allowedIP = await prisma.allowedIP.findUnique({
      where: { id },
    });

    if (!allowedIP) {
      return res.status(404).json({
        success: false,
        error: 'Allowed IP not found',
      });
    }

    res.json({
      success: true,
      data: allowedIP,
    });
  } catch (error) {
    console.error('Error getting allowed IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get allowed IP',
    });
  }
};

/**
 * Create new allowed IP
 */
export const createAllowedIP = async (req: Request, res: Response) => {
  try {
    const { ipAddress, type = 'SINGLE', description, isActive = true } = req.body;

    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required',
      });
    }

    // Validate IP format
    if (type === 'SINGLE') {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ipAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid IP address format. Expected format: xxx.xxx.xxx.xxx',
        });
      }
    } else if (type === 'RANGE') {
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      if (!cidrRegex.test(ipAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CIDR format. Expected format: xxx.xxx.xxx.xxx/xx',
        });
      }
    }

    // Check if IP already exists
    const existingIP = await prisma.allowedIP.findUnique({
      where: { ipAddress },
    });

    if (existingIP) {
      return res.status(409).json({
        success: false,
        error: 'IP address already exists',
      });
    }

    const allowedIP = await prisma.allowedIP.create({
      data: {
        ipAddress,
        type,
        description,
        isActive,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Allowed IP created successfully',
      data: allowedIP,
    });
  } catch (error) {
    console.error('Error creating allowed IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create allowed IP',
    });
  }
};

/**
 * Update allowed IP
 */
export const updateAllowedIP = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ipAddress, type, description, isActive } = req.body;

    // Check if IP exists
    const existingIP = await prisma.allowedIP.findUnique({
      where: { id },
    });

    if (!existingIP) {
      return res.status(404).json({
        success: false,
        error: 'Allowed IP not found',
      });
    }

    // Validate IP format if ipAddress is being updated
    if (ipAddress) {
      const ipType = type || existingIP.type;
      if (ipType === 'SINGLE') {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid IP address format. Expected format: xxx.xxx.xxx.xxx',
          });
        }
      } else if (ipType === 'RANGE') {
        const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        if (!cidrRegex.test(ipAddress)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid CIDR format. Expected format: xxx.xxx.xxx.xxx/xx',
          });
        }
      }

      // Check if new IP already exists (excluding current record)
      if (ipAddress !== existingIP.ipAddress) {
        const duplicateIP = await prisma.allowedIP.findUnique({
          where: { ipAddress },
        });

        if (duplicateIP) {
          return res.status(409).json({
            success: false,
            error: 'IP address already exists',
          });
        }
      }
    }

    const allowedIP = await prisma.allowedIP.update({
      where: { id },
      data: {
        ...(ipAddress && { ipAddress }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      message: 'Allowed IP updated successfully',
      data: allowedIP,
    });
  } catch (error) {
    console.error('Error updating allowed IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update allowed IP',
    });
  }
};

/**
 * Delete allowed IP
 */
export const deleteAllowedIP = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if IP exists
    const existingIP = await prisma.allowedIP.findUnique({
      where: { id },
    });

    if (!existingIP) {
      return res.status(404).json({
        success: false,
        error: 'Allowed IP not found',
      });
    }

    await prisma.allowedIP.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Allowed IP deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting allowed IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete allowed IP',
    });
  }
};

/**
 * Toggle allowed IP active status
 */
export const toggleAllowedIPStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingIP = await prisma.allowedIP.findUnique({
      where: { id },
    });

    if (!existingIP) {
      return res.status(404).json({
        success: false,
        error: 'Allowed IP not found',
      });
    }

    const allowedIP = await prisma.allowedIP.update({
      where: { id },
      data: {
        isActive: !existingIP.isActive,
      },
    });

    res.json({
      success: true,
      message: `Allowed IP ${allowedIP.isActive ? 'activated' : 'deactivated'} successfully`,
      data: allowedIP,
    });
  } catch (error) {
    console.error('Error toggling allowed IP status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle allowed IP status',
    });
  }
};

/**
 * Bulk create allowed IPs
 */
export const bulkCreateAllowedIPs = async (req: Request, res: Response) => {
  try {
    const { ips } = req.body;

    if (!Array.isArray(ips) || ips.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'IPs array is required',
      });
    }

    const results = {
      created: [] as any[],
      skipped: [] as any[],
      errors: [] as any[],
    };

    for (const ip of ips) {
      try {
        const { ipAddress, type = 'SINGLE', description, isActive = true } = ip;

        // Check if IP already exists
        const existingIP = await prisma.allowedIP.findUnique({
          where: { ipAddress },
        });

        if (existingIP) {
          results.skipped.push({ ipAddress, reason: 'Already exists' });
          continue;
        }

        const allowedIP = await prisma.allowedIP.create({
          data: {
            ipAddress,
            type,
            description,
            isActive,
          },
        });

        results.created.push(allowedIP);
      } catch (error: any) {
        results.errors.push({ ip, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bulk operation completed',
      data: results,
    });
  } catch (error) {
    console.error('Error in bulk create:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk create allowed IPs',
    });
  }
};

// ==================== IP Config (Settings) ====================

/**
 * Get IP check configuration
 */
export const getIPConfig = async (req: Request, res: Response) => {
  try {
    let config = await prisma.iPConfig.findFirst();

    // Create default config if not exists
    if (!config) {
      config = await prisma.iPConfig.create({
        data: {
          enabled: true,
          errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
        },
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error getting IP config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IP config',
    });
  }
};

/**
 * Update IP check configuration
 */
export const updateIPConfig = async (req: Request, res: Response) => {
  try {
    const { enabled, errorMessage } = req.body;

    let config = await prisma.iPConfig.findFirst();

    if (!config) {
      // Create new config
      config = await prisma.iPConfig.create({
        data: {
          enabled: enabled !== undefined ? enabled : true,
          errorMessage: errorMessage || 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
        },
      });
    } else {
      // Update existing config
      config = await prisma.iPConfig.update({
        where: { id: config.id },
        data: {
          ...(enabled !== undefined && { enabled }),
          ...(errorMessage && { errorMessage }),
        },
      });
    }

    res.json({
      success: true,
      message: 'IP config updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('Error updating IP config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update IP config',
    });
  }
};

/**
 * Toggle IP check enabled/disabled
 */
export const toggleIPCheck = async (req: Request, res: Response) => {
  try {
    let config = await prisma.iPConfig.findFirst();

    if (!config) {
      config = await prisma.iPConfig.create({
        data: {
          enabled: false, // If not exists, create with disabled
          errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
        },
      });
    } else {
      config = await prisma.iPConfig.update({
        where: { id: config.id },
        data: {
          enabled: !config.enabled,
        },
      });
    }

    res.json({
      success: true,
      message: `IP check ${config.enabled ? 'enabled' : 'disabled'} successfully`,
      data: config,
    });
  } catch (error) {
    console.error('Error toggling IP check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle IP check',
    });
  }
};

/**
 * Get current client IP (for testing/debugging)
 */
export const getCurrentIP = async (req: Request, res: Response) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    let clientIp = '';
    
    if (forwarded) {
      const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
      clientIp = ips[0].trim();
    } else {
      const realIp = req.headers['x-real-ip'];
      if (realIp) {
        clientIp = typeof realIp === 'string' ? realIp : realIp[0];
      } else {
        clientIp = req.socket.remoteAddress || 'unknown';
      }
    }

    // Remove IPv6 prefix
    const cleanIp = clientIp.replace(/^::ffff:/, '');

    // Check if IP is in allowed list
    const allowedIPs = await prisma.allowedIP.findMany({
      where: { isActive: true },
    });

    const isAllowed = allowedIPs.some(ip => {
      if (ip.type === 'SINGLE') {
        return ip.ipAddress === cleanIp;
      } else {
        // CIDR check
        try {
          const [range, bits] = ip.ipAddress.split('/');
          const mask = ~(2 ** (32 - parseInt(bits)) - 1);
          
          const ipToInt = (ipStr: string) => {
            return ipStr.split('.').reduce((int, oct) => (int << 8) + parseInt(oct), 0) >>> 0;
          };

          return (ipToInt(cleanIp) & mask) === (ipToInt(range) & mask);
        } catch {
          return false;
        }
      }
    });

    res.json({
      success: true,
      data: {
        rawIp: clientIp,
        cleanIp: cleanIp,
        isAllowed: isAllowed,
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
        },
      },
    });
  } catch (error) {
    console.error('Error getting current IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current IP',
    });
  }
};
