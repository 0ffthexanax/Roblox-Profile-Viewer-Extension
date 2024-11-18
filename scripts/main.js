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
      fetch("https://premiumfeatures.roblox.com/v1/users/current", {
        credentials: "include",
        headers,
      }),
      fetch(`https://economy.roblox.com/v1/users/${userInfo.id}/currency`, {
        credentials: "include",
        headers,
      }),
      fetch(
        `https://inventory.roblox.com/v1/users/${userInfo.id}/assets/collectibles?sortOrder=Asc&limit=100`,
        { credentials: "include", headers }
      ),
    ]);
    
    const [
      accountInfo,
      friendsInfo,
      followersInfo,
      followingsInfo,
      premiumInfo,
      robuxInfo,
      collectiblesData,
    ] = await Promise.all([
      accountAgeResponse.json(),
      friendsResponse.json(),
      followersResponse.json(),
      followingsResponse.json(),
      premiumResponse.ok ? await premiumResponse.json() : { isPremium: false },
      robuxResponse.json(),
      collectiblesResponse.json(),
    ]);
    
    const totalRAP = collectiblesData.data.reduce(
      (total, item) => total + item.recentAveragePrice,
      0
    );
    
    const accountCreationDate = new Date(accountInfo.created);
    const formattedCreationDate = accountCreationDate.toLocaleDateString("en-US");
    const currentDate = new Date();
    const accountAge = currentDate.getFullYear() - accountCreationDate.getFullYear();
    
    const formattedRobux = robuxInfo.robux.toLocaleString("en-US");
    
    document.getElementById("id").innerHTML = `<strong>ID:</strong> ${userInfo.id}`;
    document.getElementById("username").innerHTML = `<strong>Username:</strong> ${userInfo.name}`;
    document.getElementById("display-name").innerHTML = `<strong>Display Name:</strong> ${userInfo.displayName}`;
    document.getElementById("account-age").innerHTML = `<strong>Account Age:</strong> ${accountAge} years | ${formattedCreationDate}`;
    document.getElementById("friends").innerHTML = `<strong>Friends:</strong> ${friendsInfo.count}`;
    document.getElementById("followers").innerHTML = `<strong>Followers:</strong> ${followersInfo.count}`;
    document.getElementById("followings").innerHTML = `<strong>Following:</strong> ${followingsInfo.count}`;
    document.getElementById("premium").innerHTML = `<strong>Premium Status:</strong> ${premiumInfo.isPremium ? "Yes" : "No"}`;
    document.getElementById("robux").innerHTML = `<strong>Robux:</strong> ${formattedRobux}`;
    document.getElementById("rap").innerHTML = `<strong>RAP:</strong> ${totalRAP.toLocaleString("en-US")}`;
    

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

document.getElementById("search-button").addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('./pages/search.html')})
})