exports.sendLikeNotification = functions.database
    .ref("/Users/{userId}/Notes/{categoryKey}/{noteKey}/notificationLikeTrigger")
    .onWrite(async (change, context) => {
        const noteKey = context.params.noteKey;
        const userId = context.params.userId;
        const categoryKey = context.params.categoryKey;

        if (!change.after.exists()) return null;

        const likeData = change.after.val();
        const likeUserId = likeData.userID;

        const noteSnap = await admin
            .database()
            .ref(`/Users/${userId}/Notes/${categoryKey}/${noteKey}`)
            .once("value");
        const noteOwnerId = noteSnap.val().userID;

        if (noteOwnerId === likeUserId) return null;

        const userSnap = await admin
            .database()
            .ref(`/Users/${noteOwnerId}/fcmToken`)
            .once("value");
        const fcmToken = userSnap.val();

        if (!fcmToken) {
            console.log("No FCM token found for user.");
            return null;
        }

        const likeUserSnap = await admin
            .database()
            .ref(`/Users/${likeUserId}`)
            .once("value");
        const likeUserName = likeUserSnap.val().username || "Someone";

        const payload = {
            notification: {
                title: "New Like!",
                body: `${likeUserName} liked your note.`,
                sound: "default",
            },
        };

        return admin
            .messaging()
            .sendToDevice(fcmToken, payload)
            .then((response) => {
                console.log("Successfully sent message:", response);
                return null;
            })
            .catch((error) => {
                console.error("Error sending message:", error);
                return null;
            });
    });
