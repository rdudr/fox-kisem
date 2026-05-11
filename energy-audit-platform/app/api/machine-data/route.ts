import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const client = await clientPromise;
    const db = client.db('energy-audit');
    
    const machineData = {
      ...data,
      timestamp: new Date(),
    };

    const result = await db.collection('machine-data').insertOne(machineData);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Machine data save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const plant = searchParams.get('plant');
    const machineType = searchParams.get('machineType');
    const machineName = searchParams.get('machineName');

    const client = await clientPromise;
    const db = client.db('energy-audit');
    
    const filter: any = {};
    if (username) filter.username = username;
    if (plant) filter.plant = plant;
    if (machineType) filter.machineType = machineType;
    if (machineName) filter.machineName = machineName;

    const data = await db
      .collection('machine-data')
      .find(filter)
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Machine data fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
