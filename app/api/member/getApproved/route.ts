/*import { connectToDatabase } from "@/lib/mongodb";
import Member from '@/models/member';  // Ensure this points to the correct member model

export async function GET() {
  try {
    await connectToDatabase();
    // Find approved members
    const approvedMembers = await Member.find({ status: 'pending' });

    // Log the fetched data
    console.log('Fetched approved members:', approvedMembers);

    if (approvedMembers.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No approved members found',
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: approvedMembers,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch approved members:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch approved members',
        error: error instanceof Error ? error.message : 'Internal Server Error',
      }),
      { status: 500 }
    );
  }
}

*/