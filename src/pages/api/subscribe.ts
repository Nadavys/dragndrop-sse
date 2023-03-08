import {NextApiRequest, NextApiResponse} from 'next'
import eventEmitterInstance from '../../lib/eventEmitterInstance'
let clients:any = [];

// console.log(eventEmitterInstance)

eventEmitterInstance.on('update', (msg:any) => {
  console.log('***---> Data Received', msg, {clients});

  sendEventsToAll(msg)
});


// export const sleep = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));

// curl -Nv localhost:3000/api/see
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  const clientId = Date.now();

  const data = `Server Sent EVent: Connected. Client ID ${clientId}\n\n`;
  
  res.write(data);

  const newClient = {
    id: clientId,
    res
  };

  clients.push(newClient);


  req.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client:any) => client.id !== clientId);
  });
}


export default handler;

export function sendEventsToAll(msg:{entity:string, version?:number }) {
  console.log(clients.length)
  clients.forEach((client:any) => client.res.write(`data: ${JSON.stringify(msg)}\n\n`))
}
