import { randomUUID } from 'crypto';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  private students: StudentResponseDto[] = [];

  @Get()
  @ApiOperation({ summary: 'List all students' })
  findAll(): StudentResponseDto[] {
    return this.students;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  create(@Body() dto: CreateStudentDto): StudentResponseDto {
    const student: StudentResponseDto = {
      id: randomUUID(),
      name: dto.name,
      age: dto.age,
      grade_target: dto.grade_target,
      interests: dto.interests,
    };
    this.students.push(student);
    return student;
  }
}
