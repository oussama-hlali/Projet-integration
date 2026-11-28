-- Photo JPEG compressée en base64, jointe à une annonce objet perdu/trouvé.
ALTER TABLE engagement.lost_found
    ADD COLUMN IF NOT EXISTS photo_data TEXT;
