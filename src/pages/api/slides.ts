import { NextApiRequest, NextApiResponse } from 'next'
import eventEmitterInstance from '@/lib/eventEmitterInstance'
import slides from '@/initialSlides'


const slidesDB = { slides, version: 1 }  //this should come from db, not local variable
const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  const requestMethod = req.method;

  switch (requestMethod) {
    case 'POST':

      //todo: validate input
      slidesDB.slides = req.body;
      slidesDB.version++;
      
      res.status(200).json(slidesDB);
      //sent SSE
      eventEmitterInstance.emit('update', { domain: 'slides', version: slidesDB.version });
      return;

    case 'GET':
      return res.status(200).json(slidesDB)

    default:
      return res.status(200).json({ message: 'Welcome to API Routes!' })
  }

};

export default handler;

