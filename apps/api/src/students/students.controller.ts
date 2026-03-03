import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { students } from '../db/schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  @Get()
  @ApiOperation({ summary: 'List all students' })
  async findAll(): Promise<StudentResponseDto[]> {
    const rows = await db.select().from(students);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      age: r.age,
      grade_target: r.gradeTarget,
      interests: (r.interests as string[]) ?? [],
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID' })
  async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
    const [row] = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Student "${id}" not found`);
    }

    return {
      id: row.id,
      name: row.name,
      age: row.age,
      grade_target: row.gradeTarget,
      interests: (row.interests as string[]) ?? [],
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  async create(@Body() dto: CreateStudentDto): Promise<StudentResponseDto> {
    const [created] = await db
      .insert(students)
      .values({
        name: dto.name,
        age: dto.age,
        gradeTarget: dto.grade_target,
        interests: dto.interests,
      })
      .returning();

    return {
      id: created.id,
      name: created.name,
      age: created.age,
      grade_target: created.gradeTarget,
      interests: (created.interests as string[]) ?? [],
    };
  }
}
