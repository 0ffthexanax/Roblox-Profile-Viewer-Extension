async function getRobloxCookie() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getCookie" }, (response) => {
      if (response && response.success && response.cookie) {
        resolve(response.cookie);
      } else {
        resolve(null);
      }
    });
  });
}

async function fetchUserDetails(userId, headers) {
  const userResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`, {
    credentials: "include",
    headers,
  });

  if (!userResponse.ok) {
    throw new Error(`Failed to fetch details for user ID: ${userId}`);
  }

  return await userResponse.json();
}

async function fetchRobloxData() {
  try {
    const robloxCookie = await getRobloxCookie();

    if (!robloxCookie) {
      document.getElementById("content").innerHTML = `
      <h1>User is not logged in. Please log in to 
        <a href="https://www.roblox.com/Login" target="_blank" class="roblox-link">Roblox</a> and try again.
      </h1>
    `;

      // CSS for hover effect
      const style = document.createElement('style');
      style.innerHTML = `
      body {
        height: 50px;
      }

      h1 {
        margin-right: 20px;
      }

      .roblox-link {
        color: #0073e6;
        text-decoration: none;
        font-weight: bold;
        transition: color 0.3s;
      }
    
      .roblox-link:hover {
        color: #005bb5;
      }

      #footer {
        display: none; /* Hide footer */
      }
    `;
      document.head.appendChild(style);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Cookie: `.ROBLOSECURITY=${robloxCookie}`,
    };

    const userInfoResponse = await fetch("https://users.roblox.com/v1/users/authenticated", {
      credentials: "include",
      headers,
    });

    const userInfo = await userInfoResponse.json();

    const avatarResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userInfo.id}&size=150x150&format=Png&isCircular=false`,
      {
        credentials: "include",
        headers,
      }
    );
    if (!avatarResponse.ok) throw new Error("Failed to fetch avatar info.");
    const avatarInfo = await avatarResponse.json();

    const avatarUrl = avatarInfo.data[0]?.imageUrl;

    const avatarImage = document.getElementById("avatarImage");
    avatarImage.src = avatarUrl;

    avatarImage.addEventListener("click", function () {
      const link = `https://www.roblox.com/users/${userInfo.id}/profile`;
      chrome.tabs.create({ url: link });
    });

    const [
      accountAgeResponse,
      friendsResponse,
      followersResponse,
      followingsResponse,
      friendsListResponse,
      followersListResponse,
      followingsListResponse,
      premiumResponse,
      robuxResponse,
      collectiblesResponse,
    ] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userInfo.id}`, {
        credentials: "include",
        headers,
      }),
      fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/friends/count`, {
        credentials: "include",
        headers,
      }),
      fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/followers/count`, {
        credentials: "include",
        headers,
      }),
      fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/followings/count`, {
        credentials: "include",
        headers,
      }),
      fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/friends`, {
        credentials: "include",
        headers,
      }),
      fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/followers`, {
        credentials: "include",
        headers,
      }),
      fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/followings`, {
        credentials: "include",
        headers,
      }),
      fetch("https://premiumfeatures.roblox.com/v1/users/current", {
        credentials: "include",
        headers,
      }),
      fetch(`https://economy.roblox.com/v1/users/${userInfo.id}/currency`, {
        credentials: "include",
        headers,
      }),
      fetch(
        `https://inventory.roblox.com/v1/users/${userInfo.id}/assets/collectibles?sortOrder=Asc&limit=100`, {
        credentials: "include",
        headers,
      }
      ),
    ]);

    const [
      accountInfo,
      friendsInfo,
      followersInfo,
      followingsInfo,
      friendsListInfo,
      followersListInfo,
      followingListInfo,
      premiumInfo,
      robuxInfo,
      collectiblesData,
    ] = await Promise.all([
      accountAgeResponse.json(),
      friendsResponse.json(),
      followersResponse.json(),
      followingsResponse.json(),
      friendsListResponse.json(),
      followersListResponse.json(),
      followingsListResponse.json(),
      premiumResponse.ok ? await premiumResponse.json() : { isPremium: false },
      robuxResponse.json(),
      collectiblesResponse.json(),
    ]);

    const totalRAP = collectiblesData.data.reduce(
      (total, item) => total + item.recentAveragePrice,
      0
    );

    const formattedRAP = totalRAP.toLocaleString("en-US");

    const rapElement = document.getElementById("rap-items")
    rapElement.innerHTML = "";

    const rapDetailsContainer = document.createElement("div");

    if (collectiblesData.data.length === 0) {
      rapElement.textContent = "No limiteds found."
    } else {
      const limitedItemsHTML = collectiblesData.data
        .map((item) => {
          const itemID = item.assetId
          const itemName = item.name || "N/A";
          const ItemRAP = item.recentAveragePrice.toLocaleString("en-US");
          const onHold = item.isOnHold ? "Yes" : "No";
          return `
          <div style="border: 3px solid rgba(255, 255, 255, 0.2); padding: 5px; margin-bottom: 8px; border-radius: 10px;">
              <div><b>ID:</b> ${itemID}</div>
              <div><b>Name:</b> ${itemName}</div>
              <div><b>RAP:</b> ${ItemRAP}</div>
              <div><b>On Hold:</b> ${onHold}</div>
              <div><b><a class="user-profile" href="https://www.roblox.com/catalog/${itemID}" target="_blank">View Item</a></b></div>
          </div>
        `
        })
        .join("");

      rapDetailsContainer.innerHTML = limitedItemsHTML
    }
    rapElement.appendChild(rapDetailsContainer);


    const accountCreationDate = new Date(accountInfo.created);
    const formattedCreationDate = accountCreationDate.toLocaleDateString("en-US");
    const currentDate = new Date();
    const accountAge = currentDate.getFullYear() - accountCreationDate.getFullYear();

    const formattedRobux = robuxInfo.robux.toLocaleString("en-US");

    document.getElementById("id").innerHTML = `<b>ID:</b> ${userInfo.id}`;
    document.getElementById("username").innerHTML = `<b>Username:</b> ${userInfo.name}`;
    document.getElementById("display-name").innerHTML = `<b>Display Name:</b> ${userInfo.displayName}`;
    document.getElementById("account-age").innerHTML = `<b>Account Age:</b> ${accountAge} years | ${formattedCreationDate}`;
    document.getElementById("friends").innerHTML = `<b>Friends:</b> ${friendsInfo.count}`;
    document.getElementById("followers").innerHTML = `<b>Followers:</b> ${followersInfo.count}`;
    document.getElementById("followings").innerHTML = `<b>Following:</b> ${followingsInfo.count}`;
    document.getElementById("premium").innerHTML = `<b>Premium Status:</b> ${premiumInfo.isPremium ? "Yes" : "No"}`;
    document.getElementById("robux").innerHTML = `<b>Robux:</b> ${formattedRobux}`;
    document.getElementById("rap").innerHTML = `<b>RAP:</b> ${formattedRAP}`;

    const friendsList = document.getElementById("friends-list");
    friendsList.innerHTML = "";

    if (friendsListInfo.data && friendsListInfo.data.length > 0) {
      const friendDetailsPromises = friendsListInfo.data.map((friend) =>
        fetchUserDetails(friend.id, headers).catch((error) => {
          console.error(`Error fetching details for friend ${friend.id}:`, error);
          return null;
        })
      );

      const friendsDetails = await Promise.all(friendDetailsPromises);
      const friendsHTML = friendsDetails
        .filter((userDetails) => userDetails !== null)
        .map((userDetails) => {
          const id = userDetails.id || "N/A";
          const username = userDetails.name || "N/A";
          const displayName = userDetails.displayName || "N/A";
          const hasBadge = userDetails.hasVerifiedBadge
            ? `Yes<img src="https://en.help.roblox.com/hc/article_attachments/7997146649876" alt="Verified Badge" style="width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;">`
            : "No";

          return `
            <div style="border: 3px solid rgba(255, 255, 255, 0.2); padding: 5px; margin-bottom: 8px; border-radius: 10px;">
              <div><b>ID:</b> ${id}</div>
              <div><b>Username:</b> ${username}</div>
              <div><b>Display Name:</b> ${displayName}</div>
              <div><b>Verified:</b> ${hasBadge}</div>
              <div><b><a class="user-profile" href="https://roblox.com/users/${id}/profile" target="_blank">View Profile</a></b></div>
            </div>
          `;
        })
        .join("");

      friendsList.innerHTML = friendsHTML
    } else {
      friendsList.textContent = "No friends found.";
    }



    const followersList = document.getElementById("followers-list");
    followersList.innerHTML = "";

    if (followersListInfo.data && followersListInfo.data.length > 0) {
      const followerDetailsPromises = followersListInfo.data.map((follower) =>
        fetchUserDetails(follower.id, headers).catch((error) => {
          console.error(`Error fetching details for follower ${follower.id}:`, error);
          return null;
        })
      );

      const followersDetails = await Promise.all(followerDetailsPromises);
      const followersHTML = followersDetails
        .filter((userDetails) => userDetails !== null)
        .map((userDetails) => {
          const id = userDetails.id || "N/A";
          const username = userDetails.name || "N/A";
          const displayName = userDetails.displayName || "N/A";
          const hasBadge = userDetails.hasVerifiedBadge
            ? `Yes<img src="https://en.help.roblox.com/hc/article_attachments/7997146649876" alt="Verified Badge" style="width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;">`
            : "No";

          return `
            <div style="border: 3px solid rgba(255, 255, 255, 0.2); padding: 5px; margin-bottom: 8px; border-radius: 10px;">
              <div><b>ID:</b> ${id}</div>
              <div><b>Username:</b> ${username}</div>
              <div><b>Display Name:</b> ${displayName}</div>
              <div><b>Verified:</b> ${hasBadge}</div>
              <div><b><a class="user-profile" href="https://roblox.com/users/${id}/profile" target="_blank">View Profile</a></b></div>
            </div>
          `;
        })
        .join("");

      followersList.innerHTML = followersHTML;
    } else {
      followersList.textContent = "No followers found.";
    }



    const followingList = document.getElementById("following-list");
    followingList.innerHTML = "";

    if (followingListInfo.data && followingListInfo.data.length > 0) {
      const followingDetailsPromises = followingListInfo.data.map((following) =>
        fetchUserDetails(following.id, headers).catch((error) => {
          console.error(`Error fetching details for follower ${following.id}:`, error);
          return null;
        })
      );

      const followingDetails = await Promise.all(followingDetailsPromises);
      const followingHTML = followingDetails
        .filter((userDetails) => userDetails !== null)
        .map((userDetails) => {
          const id = userDetails.id || "N/A";
          const username = userDetails.name || "N/A";
          const displayName = userDetails.displayName || "N/A";
          const hasBadge = userDetails.hasVerifiedBadge
            ? `Yes<img src="https://en.help.roblox.com/hc/article_attachments/7997146649876" alt="Verified Badge" style="width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;">`
            : "No";

          return `
            <div style="border: 3px solid rgba(255, 255, 255, 0.2); padding: 5px; margin-bottom: 8px; border-radius: 10px;">
              <div><b>ID:</b> ${id}</div>
              <div><b>Username:</b> ${username}</div>
              <div><b>Display Name:</b> ${displayName}</div>
              <div><b>Verified:</b> ${hasBadge}</div>
              <div><b><a class="user-profile" href="https://roblox.com/users/${id}/profile" target="_blank">View Profile</a></b></div>
            </div>
          `;
        })
        .join("");

      followingList.innerHTML = followingHTML
    } else {
      followingList.textContent = "No followings found.";
    }

    const cookieValueElement = document.getElementById("cookieValue");
    const cookieDetails = document.getElementById("cookieDetails");
    const copyButton = document.getElementById("copyButton");

    if (robloxCookie) {
      cookieValueElement.textContent = robloxCookie;
    } else {
      console.warn("Roblox cookie value is missing or undefined.");
      cookieValueElement.textContent = "No cookie available.";
    }

    cookieDetails.addEventListener("toggle", () => {
      if (cookieDetails.open) {
        cookieValueElement.style.display = "block";
      } else {
        cookieValueElement.style.display = "none";
      }
    });

    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(robloxCookie).then(() => {
        alert(
          "Cookie copied to clipboard!\n\nNote: Always exercise caution when sharing or using your .ROBLOSECURITY cookie, as it grants access to your Roblox account"
        );
      }).catch((err) => {
        console.error("Failed to copy the cookie:", err);
        alert("Failed to copy the cookie.");
      });
    });
  } catch (error) {
    console.error(error);
    document.getElementById("content").innerHTML = `<h1><b>Error:</b> ${error.message}<h1>`;
  }
}

fetchRobloxData();

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

document.getElementById("version").textContent = `Made by 0ffthexanax | ${version}`;