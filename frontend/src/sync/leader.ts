const TAB_ID = crypto.randomUUID();
const TAB_TIMESTAMP = Date.now();
let isLeader = false;
let lastLeaderPulse = Date.now();
let heartbeatTimer: any = null;

const channel = new BroadcastChannel('sync-leader-election');

export const getTabId = () => TAB_ID;
export const checkIfLeader = () => isLeader;

export const initLeaderElection = () => {
  console.log(`[Sync Leader] Initializing for tab: ${TAB_ID}`);

  // Listen for leadership messages
  channel.onmessage = (event) => {
    const { type, tabId, tabTimestamp } = event.data;

    if (type === 'LEADER_ALIVE' || type === 'CLAIM_LEADERSHIP') {
      lastLeaderPulse = Date.now();
      if (tabId !== TAB_ID) {
        // The older tab (smaller timestamp) should be the leader.
        // If timestamps are equal, fallback to UUID string comparison to break the tie.
        const otherIsOlder = tabTimestamp < TAB_TIMESTAMP || (tabTimestamp === TAB_TIMESTAMP && tabId > TAB_ID);
        
        if (isLeader && otherIsOlder) {
          relinquishLeadership();
        } else if (!otherIsOlder) {
          // I am older, I should keep/take leadership. The other tab will yield.
        } else {
          isLeader = false;
        }
      }
    }
  };

  // Heartbeat: If I am leader, tell others. If not, check if leader is dead.
  startHeartbeat();
};

const startHeartbeat = () => {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (isLeader) {
      channel.postMessage({ type: 'LEADER_ALIVE', tabId: TAB_ID, tabTimestamp: TAB_TIMESTAMP });
    } else if (Date.now() - lastLeaderPulse > 2000) {
      // Leader is dead, claim leadership
      console.log(`[Sync Leader] Leader timeout. Tab ${TAB_ID} claiming leadership.`);
      isLeader = true;
      channel.postMessage({ type: 'CLAIM_LEADERSHIP', tabId: TAB_ID, tabTimestamp: TAB_TIMESTAMP });
      
      // Start processing if we have pending items
      import('./engine').then(({ processSyncQueue }) => {
        processSyncQueue();
      });
    }
  }, 1000);
};

export const relinquishLeadership = () => {
  isLeader = false;
  console.log(`[Sync Leader] Tab ${TAB_ID} relinquishing leadership`);
};
