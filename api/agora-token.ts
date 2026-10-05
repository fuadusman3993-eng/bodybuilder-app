import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

const APP_ID = '511e8cc7f06a4bd89ba9e4aad921c158';
const APP_CERTIFICATE = '3f20e89041df418bbf9753b11eb5b470';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { channel, uid } = req.query;

  if (!channel || typeof channel !== 'string') {
    return res.status(400).json({ error: 'channel is required' });
  }

  const uidNum = uid ? parseInt(uid as string, 10) : 0;
  const role = RtcRole.PUBLISHER;

  // Token valid for 24 hours
  const expirationTimeInSeconds = 86400;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channel,
      uidNum,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return res.status(200).json({ token, uid: uidNum });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
