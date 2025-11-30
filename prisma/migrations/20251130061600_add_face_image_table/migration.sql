-- CreateTable
CREATE TABLE "face_images" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "face_images_student_id_key" ON "face_images"("student_id");

-- CreateIndex
CREATE INDEX "face_images_student_id_idx" ON "face_images"("student_id");

-- AddForeignKey
ALTER TABLE "face_images" ADD CONSTRAINT "face_images_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
