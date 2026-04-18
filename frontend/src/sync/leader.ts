const TAB_ID = crypto.randomUUID();
let isLeader = false;
let lastLeaderPulse = Date.now();

const channel = new BroadcastChannel('sync-leader-election');

export const getTabId = () => TAB_ID;
export const checkIfLeader = () => isLeader;

export const initLeaderElection = () => {
  console.log(`[Sync Leader] Initializing for tab: ${TAB_ID}`);

  // Listen for leadership messages
  channel.onmessage = (event) => {
    const { type, tabId } = event.data;

    if (type === 'LEADER_ALIVE' || type === 'CLAIM_LEADERSHIP') {
      lastLeaderPulse = Date.now();
      if (tabId !== TAB_ID) {
        if (isLeader && tabId > TAB_ID) {
          relinquishLeadership();
        } else if (tabId !== TAB_ID) {
          isLeader = false;
        }
      }
    }
  };

  // Heartbeat: If I am leader, tell others. If not, check if leader is dead.
  setInterval(() => {
    if (isLeader) {
      channel.postMessage({ type: 'LEADER_ALIVE', tabId: TAB_ID });
    } else {
      // If no pulse for 5 seconds, try to claim leadership
      if (Date.now() - lastLeaderPulse > 5000) {
        console.log('[Sync Leader] No leader detected. Attempting to claim leadership...');
        claimLeadership();
      }
    }
  }, 2000);

  // Claim leadership on initial boot to start the process
  claimLeadership();
};

function claimLeadership() {
  isLeader = true;
  lastLeaderPulse = Date.now();
  channel.postMessage({ type: 'CLAIM_LEADERSHIP', tabId: TAB_ID });
  console.log(`[Sync Leader] Tab ${TAB_ID} is now the ACTIVE LEADER.`);
}

function relinquishLeadership() {
  isLeader = false;
  console.log(`[Sync Leader] Tab ${TAB_ID} relinquished leadership.`);
}
