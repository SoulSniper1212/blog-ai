import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(request: NextRequest) {
  try {
    const { password, action } = await request.json();

    if (action === 'login') {
      if (password === ADMIN_PASSWORD) {
        // Create JWT token
        const token = sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        
        // Set cookie
        const response = NextResponse.json({ success: true, message: 'Login successful' });
        response.cookies.set('admin_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 // 24 hours
        });
        
        return response;
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid password' },
          { status: 401 }
        );
      }
    } else if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logout successful' });
      response.cookies.delete('admin_token');
      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const decoded = verify(token.value, JWT_SECRET);
      return NextResponse.json({ authenticated: true, user: decoded });
    } catch (error) {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
} 