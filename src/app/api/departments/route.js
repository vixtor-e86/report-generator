import { NextResponse } from 'next/server';
import universityStructure from '@/data/engineering-departments.json'; // The file we just updated

export async function GET() {
  return NextResponse.json(universityStructure);
}