import { NextRequest, NextResponse } from 'next/server';
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${FASTAPI_BASE_URL}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
    const responseData = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.detail || 'An error occurred while processing your archive' },
        { status: response.status }
      );
    }

    // Return successful response
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Error in upload-twitter-archive API route:', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Unable to connect to the backend service' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}