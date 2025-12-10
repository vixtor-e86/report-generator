import { NextResponse } from 'next/server';
import departments from '@/data/engineering-departments.json';

export async function GET() {
  return NextResponse.json(departments);
}