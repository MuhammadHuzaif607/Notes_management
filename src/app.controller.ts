import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getHome(@Res() res: Response) {
    res.send('<h1>Welcome to Notes API</h1><p>Backend is running.</p>');
  }
}
