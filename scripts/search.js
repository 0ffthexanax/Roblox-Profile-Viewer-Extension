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

async function userSearch() {
  try {
    const robloxCookie = await getRobloxCookie();

    const headers = {
      "Content-Type": "application/json",
      Cookie: `.ROBLOSECURITY=${robloxCookie}`,
    };

    const searchType = document.getElementById("search-type");
    const searchInput = document.getElementById("search-input");

    searchType.addEventListener("change", () => {
      const selectedType = searchType.value;

      if (selectedType === "username") {
        searchInput.placeholder = "Enter Roblox username...";
        searchInput.pattern = ".*";
        searchInput.value = "";
      } else if (selectedType === "userId") {
        searchInput.placeholder = "Enter Roblox user ID...";
        searchInput.pattern = "\\d*";
        searchInput.value = "";
      }
    });

    const searchButton = document.getElementById("search-button");
    searchButton.addEventListener("click", async () => {
      await performSearch();
    });

    searchInput.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await performSearch();
      }
    });

    async function performSearch() {
      const searchType = document.getElementById("search-type").value;
      const searchInput = document.getElementById("search-input").value.trim();

      if (searchInput === "") {
        alert("Please enter a search value.");
        return;
      }

      if (searchType === "userId") {
        if (isNaN(searchInput)) {
          alert("Please enter an ID instead of a username.");
          return;
        }
      }

      try {
        let user;

        if (searchType === "username") {
          const userProfileResponse = await fetch(
            `https://users.roblox.com/v1/users/search?keyword=${searchInput}`,
            {
              credentials: "include",
              headers,
            }
          );

          if (!userProfileResponse.ok) {
            throw new Error("Failed to fetch user by username.");
          }

          const userProfile = await userProfileResponse.json();
          if (userProfile.data && userProfile.data.length > 0) {
            user = userProfile.data.find((profile) => profile.name.toLowerCase() === searchInput.toLowerCase());

            if (!user) {
              alert("No exact match found for that username.");
              return;
            }
          } else {
            alert("No user found with that username.");
            return;
          }
        } else if (searchType === "userId") {
          const userResponse = await fetch(
            `https://users.roblox.com/v1/users/${searchInput}`,
            {
              credentials: "include",
              headers,
            }
          );

          if (!userResponse.ok) {
            throw new Error("Failed to fetch user by ID.");
          }

          user = await userResponse.json();
        } else {
          alert("Invalid search type selected.");
          return;
        }

        const avatarResponse = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`,
          { credentials: "include", headers }
        );
        const accountAgeResponse = await fetch(
          `https://users.roblox.com/v1/users/${user.id}`,
          { credentials: "include", headers }
        );
        const friendsResponse = await fetch(
          `https://friends.roblox.com/v1/users/${user.id}/friends/count`,
          { credentials: "include", headers }
        );
        const followersResponse = await fetch(
          `https://friends.roblox.com/v1/users/${user.id}/followers/count`,
          { credentials: "include", headers }
        );
        const followingsResponse = await fetch(
          `https://friends.roblox.com/v1/users/${user.id}/followings/count`,
          { credentials: "include", headers }
        );
        const collectiblesResponse = await fetch(
          `https://inventory.roblox.com/v1/users/${user.id}/assets/collectibles?sortOrder=Asc&limit=100`,
          { credentials: "include", headers }
        );

        const [
          avatarInfo,
          accountInfo,
          friendsInfo,
          followersInfo,
          followingsInfo,
          collectiblesData,
        ] = await Promise.all([
          avatarResponse.json(),
          accountAgeResponse.json(),
          friendsResponse.json(),
          followersResponse.json(),
          followingsResponse.json(),
          collectiblesResponse.json(),
        ]);

        const totalRAP = collectiblesData?.data?.reduce(
          (total, item) => total + (item.recentAveragePrice || 0),
          0
        );

        const accountCreationDate = new Date(accountInfo.created);
        const formattedCreationDate = accountCreationDate.toLocaleDateString("en-US");
        const currentDate = new Date();
        const accountAge = currentDate.getFullYear() - accountCreationDate.getFullYear();

        document.getElementById("id").innerHTML = `<strong>ID:</strong> ${user.id}`;
        document.getElementById("username").innerHTML = `<strong>Username:</strong> ${user.name}`;
        document.getElementById("display-name").innerHTML = `<strong>Display Name:</strong> ${user.displayName || "N/A"}`;
        document.getElementById("account-age").innerHTML = `<strong>Account Age:</strong> ${accountAge} years | ${formattedCreationDate}`;
        document.getElementById("friends").innerHTML = `<strong>Friends:</strong> ${friendsInfo.count}`;
        document.getElementById("followers").innerHTML = `<strong>Followers:</strong> ${followersInfo.count.toLocaleString("en-US")}`;
        document.getElementById("followings").innerHTML = `<strong>Following:</strong> ${followingsInfo.count}`;
        document.getElementById("rap").innerHTML = `<strong>RAP:</strong> ${totalRAP?.toLocaleString("en-US") || "N/A"}`;

        const avatarImage = document.getElementById("avatarImage");
        avatarImage.src = avatarInfo.data[0]?.imageUrl || "";
        avatarImage.style.visibility = "visible";
      } catch (error) {
        console.error(error);
        alert("An error occurred while fetching user data.");
      }
    }
  } catch (error) {
    console.error(error);
    alert("Failed to initialize user search.");
  }
}

userSearch();
