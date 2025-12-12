// src/app/api/seed-universities/route.js

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import universities from '@/data/nigerian-universities.json';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // STEP 1: Clean the JSON file itself (Remove duplicates inside the file)
    const uniqueNamesInFile = new Set();
    const cleanList = [];

    for (const uni of universities) {
      // If we haven't seen this name yet in this loop, add it
      if (!uniqueNamesInFile.has(uni.name)) {
        uniqueNamesInFile.add(uni.name);
        cleanList.push(uni);
      }
    }

    // STEP 2: Check the Database for existing schools
    const { data: existingData, error: fetchError } = await supabase
      .from('universities')
      .select('name');

    if (fetchError) throw fetchError;

    // Create a Set of names that are ALREADY in the DB
    const existingDbNames = new Set(existingData.map(u => u.name));

    // STEP 3: Filter out schools that are already in the DB
    const finalListToInsert = cleanList.filter(inst => !existingDbNames.has(inst.name));

    if (finalListToInsert.length === 0) {
      return NextResponse.json({ 
        message: 'No new institutions to add. Database is up to date.', 
        totalInFile: cleanList.length 
      }, { status: 200 });
    }

    // STEP 4: Insert the final clean list
    const { data, error } = await supabase
      .from('universities')
      .insert(finalListToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Success! Added ${data.length} new institutions.`,
      addedInstitutions: data
    }, { status: 200 });

  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}