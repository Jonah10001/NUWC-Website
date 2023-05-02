
      const CLIENT_ID = '19160401878-ugm2fgaqag0b5cmfe09l7ed6hvf7mt9l.apps.googleusercontent.com';
      const API_KEY = 'AIzaSyDYyb_54-iu8gh829eP-hW-eZP8-o6Wy-w';

      // Discovery doc URL for APIs used by the quickstart
      const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

      let tokenClient;
      let gapiInited = false;
      let gisInited = false;

      document.getElementById('authorize_button').style.visibility = 'hidden';
      document.getElementById('signout_button').style.visibility = 'hidden';

      /**
       * Callback after api.js is loaded.
       */
      function gapiLoaded() {
        gapi.load('client', initializeGapiClient);
      }

      /**
       * Callback after the API client is loaded. Loads the
       * discovery doc to initialize the API.
       */
      async function initializeGapiClient() {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
      }

      /**
       * Callback after Google Identity Services are loaded.
       */
      function gisLoaded() {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        maybeEnableButtons();
      }

      /**
       * Enables user interaction after all libraries are loaded.
       */
      function maybeEnableButtons() {
        if (gapiInited && gisInited) {
          document.getElementById('authorize_button').style.visibility = 'visible';
        }
      }

      /**
       *  Sign in the user upon button click.
       */
      function handleAuthClick() {
        tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            throw (resp);
          }
          document.getElementById('signout_button').style.visibility = 'visible';
          document.getElementById('authorize_button').innerText = 'Refresh';
          // await listMajors();
          // await addTeams();
        };

        if (gapi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent to share their data
          // when establishing a new session.
          tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
          // Skip display of account chooser and consent dialog for an existing session.
          tokenClient.requestAccessToken({prompt: ''});
        }
      }

      /**
       *  Sign out the user upon button click.
       */
      function handleSignoutClick() {
        const token = gapi.client.getToken();
        if (token !== null) {
          google.accounts.oauth2.revoke(token.access_token);
          gapi.client.setToken('');
          document.getElementById('content').innerText = '';
          document.getElementById('authorize_button').innerText = 'Authorize';
          document.getElementById('signout_button').style.visibility = 'hidden';
        }
      }

      async function access_range(requested) {
        let response;
        try {
          // Fetch team data
          response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1XbpHC_l5L75ujJ5U1Ygj0H30L-tu3FUFiVEQlJ86e6o',
            range: requested,
          });
        } catch (err) {
          console.error(err);
          return;
        }
        const range = response.result;
        if (!range || !range.values || range.values.length === 0) {
          console.error('No values found.');
          return;
        }
      
        const teamData = range.values;
        console.log("team data: " + teamData);
        return teamData;
      }

      async function listMajors() {
        let response;
        try {
          // Fetch first 10 files
          response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1XbpHC_l5L75ujJ5U1Ygj0H30L-tu3FUFiVEQlJ86e6o',
            range: 'Group A!A2:E',
          });
        } catch (err) {
          document.getElementById('content').innerText = err.message;
          return;
        }
        const range = response.result;
        if (!range || !range.values || range.values.length == 0) {
          document.getElementById('content').innerText = 'No values found.';
          return;
        }
        const output = range.values.reduce(
            (str, row) => `${str}${row[0]}, ${row[4]}\n`,
            'Name, Major:\n');
        document.getElementById('content').innerText = output;
      }

      async function addTeams() {
        let html = `<h1>Standings</h1>`;
        const container = document.getElementById('container');
        let teamData;
        let color;
        let thirdPlace = [];

        const arr = ['A', 'B', 'C', 'D', 'E', 'F'];

        for (element of arr) {
          html += `<h2>Group ${element}</h2>
          <div class="row" id="header">
            <div class="team">Team</div>
            <div class="wins">W</div>
            <div class="losses">L</div>
            <div class="draws">D</div>
            <div class="goals">GD</div>
            <div class="points">Pts</div>
          </div>`;
          teamData = await access_range(`Group ${element}!A2:F`);
          console.log("post return team data: " + teamData);

          teamData.sort(function(a, b) {
            if (a[5] !== b[5]) {
              return b[5] - a[5];
            } else {
              return b[4] - a[4];
            }
          });

          for (let i = 0; i <= teamData.length - 1; i++) {
            const arr = teamData[i];
            if (i == 0 || i == 1) {
              color = "#BBF3BB";
            } else if (i == 2){
              color = "#BBF3FF";
              thirdPlace.push(arr);
            }
            else {
              color = "#EAECF0";
            }
            html += `
            <div class="row" style="background-color: ${color};">
              <div class="team">${arr[0]}</div>
              <div class="wins">${arr[1]}</div>
              <div class="losses">${arr[2]}</div>
              <div class="draws">${arr[3]}</div>
              <div class="goals">${arr[4]}</div>
              <div class="points">${arr[5]}</div>
          </div>
            `;
        }
      }
      html += `<h2>Third Place Teams</h2>
      <div class="row" id="header">
        <div class="team">Team</div>
        <div class="wins">W</div>
        <div class="losses">L</div>
        <div class="draws">D</div>
        <div class="goals">GD</div>
        <div class="points">Pts</div>
      </div>`;

        thirdPlace.sort(function(a, b) {
          if (a[5] !== b[5]) {
            return b[5] - a[5];
          } else {
            return b[4] - a[4];
          }
        });

        for (let i = 0; i <= thirdPlace.length - 1; i++) {
          const arr = thirdPlace[i];
          if (i < 4) {
            color = "#BBF3BB";
          } else {
            color = "#EAECF0";
          }
          html += `
          <div class="row" style="background-color: ${color};">
            <div class="team">${arr[0]}</div>
            <div class="wins">${arr[1]}</div>
            <div class="losses">${arr[2]}</div>
            <div class="draws">${arr[3]}</div>
            <div class="goals">${arr[4]}</div>
            <div class="points">${arr[5]}</div>
        </div>
          `;
      }

    console.log(html);
    container.innerHTML = html;
}

        function getSelectedValue() {
			const dropdown = document.getElementById("mySelect");
			const selectedValue = dropdown.value;
			console.log("Selected value: " + selectedValue);
            if (selectedValue === "schedule") {
                handleScheduleToggle();
            } else if (selectedValue === "bracket"){
                handleBracketToggle();
            } else if (selectedValue === "standings") {
                addTeams();
            }
		}

        async function handleScheduleToggle() {
          let response;
        try {
          // Fetch team data
          response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1XbpHC_l5L75ujJ5U1Ygj0H30L-tu3FUFiVEQlJ86e6o',
            range: 'Schedule!A2:G',
          });
        } catch (err) {
          console.error(err);
          return;
        }
        const range = response.result;
        if (!range || !range.values || range.values.length === 0) {
          console.error('No values found.');
          return;
        }
      
        const schedule = range.values;
        const container = document.getElementById('container');


            var html = `<h1>Group Stage Match Schedule</h1>
            <table>
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Home Team</th>
                  <th>Away Team</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Home Score</th>
                  <th>Away Score</th>
                </tr>
              </thead>
              <tbody>`;

              for (let i = 0; i<= schedule.length - 1; i++) {
                const arr = schedule[i];
                html += `
                      <tr>
                        <td>Match ${arr[0]}</td>
                        <td>${arr[1]}</td>
                        <td>${arr[2]}</td>
                        <td>${arr[3]}</td>
                        <td>${arr[4]}</td>
                        <td>${arr[5]}</td>
                        <td>${arr[6]}</td>
                      </tr>`;
              }

                html +=`
              </tbody>
            </table>`;

            console.log(html);

            container.innerHTML = html;
        }

        function handleBracketToggle() {
            console.log("here");
            const container = document.getElementById('container');

            var html = 
            `<div class="headerText">
            Tournament Live Bracket
        </div>
      <div class="tournament-bracket">
            <div class="round r-of-8">
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 1
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 2
                    <div class="score">
                    1
                    </div>
                </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 3
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 4
                    <div class="score">
                    2
                    </div>
                </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 5
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 6
                    <div class="score">
                    0
                    </div>
                </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 7
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 8
                    <div class="score">
                    1
                    </div>
                </div>
                </div>
            </div>
            <div class="round r-of-4">
                <div class="bracket-game">
                    1:00PM
                    <div class="player top win">
                        Team 1
                        <div class="score">
                        3
                        </div>
                    </div>
                    <div class="player bot loss">
                        Team 2
                        <div class="score">
                        1
                        </div>
                    </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                    <div class="player top win">
                        Team 3
                        <div class="score">
                        3
                        </div>
                    </div>
                    <div class="player bot loss">
                        Team 4
                        <div class="score">
                        2
                        </div>
                    </div>
                </div>
            </div>
            <div class="center-two">
                <div class="center">
                </div>
                <div class="center-content">
                    <div class="final-games">
                        <div class="round r-of-2">
                            <div class="bracket-game">
                                1:00PM
                                <div class="player top win">
                                    Team 1
                                    <div class="score">
                                    3
                                    </div>
                                </div>
                                <div class="player bot loss">
                                    Team 2
                                    <div class="score">
                                    1
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="round r-of-2">
                            <div class="bracket-game">
                                1:00PM
                                <div class="player top win">
                                    Team 1
                                    <div class="score">
                                    3
                                    </div>
                                </div>
                                <div class="player bot loss">
                                    Team 2
                                    <div class="score">
                                    1
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="champ-header">
                            <h3>Championship</h3>
                        </div>
                        <div class="champ-game">
                            <div class="round r-of-2">
                                <div class="bracket-game">
                                    1:00PM
                                    <div class="player top win">
                                        Team 1
                                        <div class="score">
                                        3
                                        </div>
                                    </div>
                                    <div class="player bot loss">
                                        Team 2
                                        <div class="score">
                                        1
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="round r-of-4">
                <div class="bracket-game">
                    1:00PM
                    <div class="player top win">
                        Team 1
                        <div class="score">
                        3
                        </div>
                    </div>
                    <div class="player bot loss">
                        Team 2
                        <div class="score">
                        1
                        </div>
                    </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                    <div class="player top win">
                        Team 3
                        <div class="score">
                        3
                        </div>
                    </div>
                    <div class="player bot loss">
                        Team 4
                        <div class="score">
                        2
                        </div>
                    </div>
                </div>
            </div>
            <div class="round r-of-8">
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 1
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 2
                    <div class="score">
                    1
                    </div>
                </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 3
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 4
                    <div class="score">
                    2
                    </div>
                </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 5
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 6
                    <div class="score">
                    0
                    </div>
                </div>
                </div>
                <div class="bracket-game">
                    1:00PM
                <div class="player top win">
                    Team 7
                    <div class="score">
                    3
                    </div>
                </div>
                <div class="player bot loss">
                    Team 8
                    <div class="score">
                    1
                    </div>
                </div>
                </div>
            </div>
        </div>`;

            container.innerHTML = html;
        }