async function getRobloxCookie() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getCookie" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(`Error: ${chrome.runtime.lastError.message}`);
      } else if (response && response.success) {
        resolve(response.cookie);
      } else {
        reject(response ? response.error : "Failed to retrieve cookie.");
      }
    });
  });
}

async function fetchRobloxData() {
  try {
    const robloxCookie = await getRobloxCookie();

    const headers = {
      "Content-Type": "application/json",
      Cookie: `.ROBLOSECURITY=${robloxCookie}`,
    };

    const userInfoResponse = await fetch("https://users.roblox.com/v1/users/authenticated", {
      credentials: "include",
      headers,
    });
    if (!userInfoResponse.ok) throw new Error("Failed to fetch user info.");
    const userInfo = await userInfoResponse.json();

    const robuxResponse = await fetch(`https://economy.roblox.com/v1/users/${userInfo.id}/currency`, {
      credentials: "include",
      headers,
    });
    if (!robuxResponse.ok) throw new Error("Failed to fetch Robux info.");
    const robuxInfo = await robuxResponse.json();

    const formattedRobux = robuxInfo.robux.toLocaleString("en-US");

    const premiumResponse = await fetch("https://premiumfeatures.roblox.com/v1/users/current", {
      credentials: "include",
      headers,
    });
    const premiumInfo = premiumResponse.ok ? await premiumResponse.json() : { isPremium: false };

    const friendsResponse = await fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/friends/count`, {
      credentials: "include",
      headers,
    });
    if (!friendsResponse.ok) throw new Error("Failed to fetch friends info.");
    const friendsInfo = await friendsResponse.json();

    const followersResponse = await fetch(`https://friends.roblox.com/v1/users/${userInfo.id}/followers/count`, {
      credentials: "include",
      headers,
    });
    if (!followersResponse.ok) throw new Error("Failed to fetch followers info.");
    const followersInfo = await followersResponse.json();

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

    document.getElementById("username").innerHTML = `<strong>Username:</strong> ${userInfo.name}`;
    document.getElementById("id").innerHTML = `<strong>ID:</strong> ${userInfo.id}`;
    document.getElementById("display-name").innerHTML = `<strong>Display Name:</strong> ${userInfo.displayName}`;
    document.getElementById("robux").innerHTML = `<strong>Robux:</strong> ${formattedRobux}`;
    document.getElementById("premium").innerHTML = `<strong>Premium Status:</strong> ${premiumInfo.isPremium ? "Yes" : "No"}`;
    document.getElementById("friends").innerHTML = `<strong>Friends:</strong> ${friendsInfo.count}`;
    document.getElementById("followers").innerHTML = `<strong>Followers:</strong> ${followersInfo.count}`;

    const cookieValueElement = document.getElementById("cookieValue");
    const cookieDetails = document.getElementById("cookieDetails");
    const copyButton = document.getElementById("copyButton");

    cookieValueElement.textContent = robloxCookie;

    cookieDetails.addEventListener("toggle", () => {
      if (cookieDetails.open) {
        cookieValueElement.style.display = "block";
      } else {
        cookieValueElement.style.display = "none";
      }
    });

    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(robloxCookie).then(() => {
        alert("Cookie copied to clipboard!");
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