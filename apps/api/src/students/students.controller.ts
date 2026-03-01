import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  @Get()
  @ApiOperation({ summary: 'List all students' })
  findAll(): StudentResponseDto[] {
    return [];
  }

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  create(@Body() dto: CreateStudentDto): StudentResponseDto {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      name: dto.name,
      age: dto.age,
      grade_target: dto.grade_target,
      interests: dto.interests,
    };
  }
}
