import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const client = await clientPromise;
    const db = client.db('energy-audit');
    
    const user = await db.collection('users').findOne({ username, password });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const now = new Date();
    const loginDate = format(now, 'yyyy-MM-dd');
    const loginTime = format(now, 'HH:mm:ss');

    const session = {
      username,
      loginDate,
      loginTime,
      firstActivityTime: loginTime,
      lastActivityTime: loginTime,
    };

    await db.collection('sessions').insertOne({
      ...session,
      timestamp: now,
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
