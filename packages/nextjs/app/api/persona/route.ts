
import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

export async function POST(request:NextRequest){
    try{
        const formData= await request.formData()
        const file =formData.get('file') as File
        if (!file) {
            return NextResponse.json(
              { error: 'No file provided' },
              { status: 400 }
            );
          }
      
          // Validate file type
          if (!file.name.endsWith('.zip')) {
            return NextResponse.json(
              { error: 'Please upload a ZIP file' },
              { status: 400 }
            );
          }
          const fastApiFormData = new FormData();
          fastApiFormData.append('file', file);
          const response = await fetch(`${FASTAPI_BASE_URL}/upload-twitter-archive`,{
            method: 'POST',
            body: fastApiFormData,

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


    } catch(error){
        console.error('Error in upload-twitter-archive API route:', error);
    
        // Handle specific error types
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