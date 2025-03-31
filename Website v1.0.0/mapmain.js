const teamCoords = {
    ATL: { city: "Atlanta", lat: 33.755, lon: -84.390 },
    BOS: { city: "Boston", lat: 42.3601, lon: -71.0589 },
    BRK: { city: "Brooklyn", lat: 40.6782, lon: -73.9442 },
    CHA: { city: "Charlotte", lat: 35.2271, lon: -80.8431 },
    CHI: { city: "Chicago", lat: 41.8781, lon: -87.6298 },
    CLE: { city: "Cleveland", lat: 41.4993, lon: -81.6944 },
    DAL: { city: "Dallas", lat: 32.7767, lon: -96.7970 },
    DEN: { city: "Denver", lat: 39.7392, lon: -104.9903 },
    DET: { city: "Detroit", lat: 42.3314, lon: -83.0458 },
    GSW: { city: "San Francisco", lat: 37.7749, lon: -122.4194 },
    HOU: { city: "Houston", lat: 29.7604, lon: -95.3698 },
    IND: { city: "Indianapolis", lat: 39.7684, lon: -86.1581 },
    LAC: { city: "Los Angeles", lat: 34.0522, lon: -118.2437 },
    LAL: { city: "Los Angeles", lat: 34.0522, lon: -118.2437 },
    MEM: { city: "Memphis", lat: 35.1495, lon: -90.0490 },
    MIA: { city: "Miami", lat: 25.7617, lon: -80.1918 },
    MIL: { city: "Milwaukee", lat: 43.0389, lon: -87.9065 },
    MIN: { city: "Minneapolis", lat: 44.9795, lon: -93.2760 },
    NOP: { city: "New Orleans", lat: 29.9511, lon: -90.0715 },
    NOH: { city: "New Orleans", lat: 29.9511, lon: -90.0715 },
    NJN: { city: "Newark", lat: 40.7357, lon: -74.1724 },
    NYK: { city: "New York", lat: 40.7128, lon: -74.0060 },
    OKC: { city: "Oklahoma City", lat: 35.4676, lon: -97.5164 },
    ORL: { city: "Orlando", lat: 28.5383, lon: -81.3792 },
    PHI: { city: "Philadelphia", lat: 39.9526, lon: -75.1652 },
    PHO: { city: "Phoenix", lat: 33.4484, lon: -112.0740 },
    POR: { city: "Portland", lat: 45.5051, lon: -122.6750 },
    SAC: { city: "Sacramento", lat: 38.5816, lon: -121.4944 },
    SAS: { city: "San Antonio", lat: 29.4241, lon: -98.4936 },
    SEA: { city: "Seattle", lat: 47.6062, lon: -122.3321 },
    TOR: { city: "Toronto", lat: 43.6532, lon: -79.3832 },
    UTA: { city: "Salt Lake City", lat: 40.7608, lon: -111.8910 },
    VAN: { city: "Vancouver", lat: 49.2827, lon: -123.1207 },
    WAS: { city: "Washington", lat: 38.9072, lon: -77.0369 },
    CHO: { city: "Charlotte", lat: 35.2271, lon: -80.8431 }
  };
  
  const svg = d3.select("#map");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const projection = d3.geoMercator().center([-95, 40]).scale(600).translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);
  
  let fullData = [];
  let playerSeasons = [];

  let allPlayers = [];

//Live suggestion R
  function suggestPlayers() {
    const input = document.getElementById("playerInput");
    const query = input.value.trim().toLowerCase();
    const suggestionBox = document.getElementById("suggestions");
    suggestionBox.innerHTML = "";

    if (query.length === 0) return;

    const matches = allPlayers.filter(name => name.toLowerCase().includes(query)).slice(0, 10);

    matches.forEach(name => {
      const div = document.createElement("div");
      div.textContent = name;
      div.onclick = () => {
        input.value = name;
        suggestionBox.innerHTML = "";
      };
      suggestionBox.appendChild(div);
    });
  }

  
  Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.csv("nba_player_stats_cleaned.csv")
  ]).then(([world, usTopo, data]) => {
    fullData = data;
    allPlayers = Array.from(new Set(data.map(d => d.Player))).sort();
    svg.append("g").selectAll("path").data(world.features).enter().append("path").attr("class", "country").attr("d", path);
    const states = topojson.feature(usTopo, usTopo.objects.states).features;
    svg.append("g").selectAll("path").data(states).enter().append("path").attr("class", "state-outline").attr("d", path);
  });
  
  function drawLogo(team, temp = false) {
    const coords = teamCoords[team];
    if (!coords) return;
    const [x, y] = projection([coords.lon, coords.lat]);
    svg.append("image")
      .attr("xlink:href", `logos/${team}.png`)
      .attr("x", x - 25)
      .attr("y", y - 25)
      .attr("width", 50)
      .attr("height", 50)
      .attr("class", `team-logo${temp ? " team-logo-temp" : ""}`);
  }
  
  function startJourney() {
    const name = document.getElementById("playerInput").value.trim().toLowerCase();
    const seasons = fullData.filter(d => d.Player.toLowerCase() === name).map(d => ({ season: d.Season, team: d.Team })).sort((a, b) => +a.season - +b.season);
    if (seasons.length === 0) return alert("Player not found.");
    playerSeasons = seasons;
    document.getElementById("sliderWrapper").style.display = "block";
    const labelContainer = document.getElementById("sliderLabels");
    labelContainer.innerHTML = "";
    svg.selectAll(".team-logo, .team-logo-temp").remove();
    seasons.forEach((s, i) => {
      const label = document.createElement("span");
      label.className = "slider-label";
      label.innerText = s.season;
      label.addEventListener("mouseenter", () => showLogoTemp(i));
      label.addEventListener("click", () => lockLogo(i));
      labelContainer.appendChild(label);
    });
    showLogoTemp(0);
  }
  
  function showLogoTemp(index) {
    svg.selectAll(".team-logo-temp").remove();
    drawLogo(playerSeasons[index].team, true);
  }
  
  function lockLogo(index) {
    drawLogo(playerSeasons[index].team);
  }
  
  function showAllTeams() {
    svg.selectAll(".team-logo, .team-logo-temp").remove();
    const seen = new Set();
    playerSeasons.forEach(({ team }) => {
      if (!seen.has(team)) {
        seen.add(team);
        drawLogo(team);
      }
    });
  }
  