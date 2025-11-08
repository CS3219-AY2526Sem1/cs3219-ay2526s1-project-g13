import roomController from '../controllers/roomController.js';
import { kafkaManager } from '../config/kafka.js';
import { pubsubManager } from '../config/pubsub.js';

const useGcp = !!process.env.PUBSUB_PROJECT_ID;

export async function handleRoomCreation(message) {
  const matchId = message.key;
  const requestData = message.value;
  
  console.log('Received room creation request:', { matchId, requestData });
  
  if (!matchId || !requestData) {
    console.error('Missing matchId or requestData');
    return;
  }

  try {
    const parsed = JSON.parse(requestData);
    const { questionId, userIds, programmingLanguage } = parsed;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.error('Invalid userIds in request');
      return;
    }
    
    const room = await roomController.create(null, questionId, userIds, programmingLanguage);
    const roomId = room.roomId;
    
    console.log('Room created successfully:', { matchId, roomId });
    
    if (useGcp) {
      await pubsubManager.publishRoomCreated(matchId, roomId);
    } else {
      await kafkaManager.publishRoomCreated(matchId, roomId);
    }
  } catch (error) {
    console.error('Error handling room creation request:', error)
  }
}

export async function setupRoomCreationConsumer() {
  if (useGcp) {
    console.log('Setting up room creation Pub/Sub consumer...');
    await pubsubManager.setupConsumer(handleRoomCreation);
    console.log('Room creation Pub/Sub consumer started');
  } else {
    console.log('Setting up room creation Kafka consumer...');
    await kafkaManager.setupConsumer(handleRoomCreation);
    console.log('Room creation Kafka consumer started');
  }
}

