// src/common/utils/s3Uploader.ts

import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

const s3 = new S3();

export const s3Uploader = (configService: ConfigService) => {
  const bucket = configService.get<string>('AWS_S3_BUCKET');

  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is not defined in environment variables');
  }

  return {
    storage: multerS3({
      s3,
      bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, `profile-pictures/${uniqueName}`);
      },
    }),

    fileFilter: (
      req: any,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void
    ) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|jpg|webp)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  };
};
