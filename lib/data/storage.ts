import { createClient } from "@/lib/utils/supabase/server";

type BucketName = 'transcripts' | 'documents' | 'videos';

export async function uploadDocument(
    bucket: BucketName, 
    filePath: string, 
    fileBody: File | Buffer | Blob,
    contentType?: string
) {
    const supabase = await createClient();
    
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBody, {
            upsert: true,
            contentType: contentType || (fileBody instanceof File ? fileBody.type : undefined)
        });

    if (error) {
        console.error(`Error uploading to ${bucket}:`, error.message);
        throw error;
    }

    return data;
}

export async function getPublicUrl(bucket: BucketName, filePath: string) {
    const supabase = await createClient();
    
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

export async function deleteDocument(bucket: BucketName, filePath: string) {
    const supabase = await createClient();
    
    const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

    if (error) {
         console.error(`Error deleting from ${bucket}:`, error.message);
         throw error;
    }
}
