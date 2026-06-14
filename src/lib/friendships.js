export const createFriendPairKey = (firstUserId, secondUserId) =>
  [String(firstUserId), String(secondUserId)].sort().join(":");

export const getOtherFriendId = (friendship, currentUserId) =>
  String(friendship.requester) === String(currentUserId)
    ? friendship.recipient
    : friendship.requester;
