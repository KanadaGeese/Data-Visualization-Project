// script.js

const TEAM_MAP = {
    "ATL": { city: "Atlanta", lat: 33.7573, lon: -84.3963 },
    "BOS": { city: "Boston", lat: 42.3663, lon: -71.0622 },
    "BRK": { city: "Brooklyn", lat: 40.6826, lon: -73.9754 },
    "CHA": { city: "Charlotte", lat: 35.2251, lon: -80.8392 },
    "CHI": { city: "Chicago", lat: 41.8807, lon: -87.6742 },
    "CLE": { city: "Cleveland", lat: 41.4965, lon: -81.6882 },
    "DAL": { city: "Dallas", lat: 32.7905, lon: -96.8104 },
    "DEN": { city: "Denver", lat: 39.7487, lon: -105.0077 },
    "DET": { city: "Detroit", lat: 42.3410, lon: -83.0551 },
    "GSW": { city: "San Francisco", lat: 37.7680, lon: -122.3877 },
    "HOU": { city: "Houston", lat: 29.7508, lon: -95.3621 },
    "IND": { city: "Indianapolis", lat: 39.7639, lon: -86.1555 },
    "LAC": { city: "Los Angeles", lat: 34.0430, lon: -118.2673 },
    "LAL": { city: "Los Angeles", lat: 34.0430, lon: -118.2673 },
    "MEM": { city: "Memphis", lat: 35.1382, lon: -90.0506 },
    "MIA": { city: "Miami", lat: 25.7814, lon: -80.1870 },
    "MIL": { city: "Milwaukee", lat: 43.0451, lon: -87.9172 },
    "MIN": { city: "Minneapolis", lat: 44.9795, lon: -93.2760 },
    "NOP": { city: "New Orleans", lat: 29.9490, lon: -90.0821 },
    "NYK": { city: "New York", lat: 40.7505, lon: -73.9934 },
    "OKC": { city: "Oklahoma City", lat: 35.4634, lon: -97.5151 },
    "ORL": { city: "Orlando", lat: 28.5392, lon: -81.3839 },
    "PHI": { city: "Philadelphia", lat: 39.9012, lon: -75.1720 },
    "PHO": { city: "Phoenix", lat: 33.4457, lon: -112.0712 },
    "POR": { city: "Portland", lat: 45.5316, lon: -122.6668 },
    "SAC": { city: "Sacramento", lat: 38.5802, lon: -121.4997 },
    "SAS": { city: "San Antonio", lat: 29.4269, lon: -98.4375 },
    "TOR": { city: "Toronto", lat: 43.6435, lon: -79.3791 },
    "UTA": { city: "Salt Lake City", lat: 40.7683, lon: -111.9011 },
    "WAS": { city: "Washington", lat: 38.8981, lon: -77.0209 }
  };
  
  // Load CSV data
  let data;
  d3.csv("../EDA NBA/nba_player_stats_C_Rami.csv", d3.autoType).then(dataset => {
    data = dataset;
  
    const players = Array.from(new Set(data.map(d => d.Player))).sort();
    const seasons = Array.from(new Set(data.map(d => d.Season))).sort((a, b) => a - b);
  
    const playerSelect = d3.select("#playerSelect");
    const seasonSelect = d3.select("#seasonSelect");
    

  
    playerSelect.selectAll("option")
      .data(players)
      .enter()
      .append("option")
      .text(d => d);
  
    seasonSelect.selectAll("option")
      .data(seasons)
      .enter()
      .append("option")
      .text(d => d);
  
    playerSelect.on("change", () => {
      updateSeasonOptions();
      updateAll();
    });
      
    seasonSelect.on("change", updateAll);
    updateSeasonOptions();
    updateAll();
    });

  function updateSeasonOptions() {
    const player = d3.select("#playerSelect").property("value");
    const playerSeasons = data
      .filter(d => d.Player === player)
      .map(d => d.Season);
  
    const uniqueSeasons = Array.from(new Set(playerSeasons)).sort((a, b) => a - b);
  
    const seasonSelect = d3.select("#seasonSelect");
    seasonSelect.selectAll("option").remove();
  
    seasonSelect.selectAll("option")
      .data(uniqueSeasons)
      .enter()
      .append("option")
      .text(d => d);
  }
  
  function updateAll() {
    const player = d3.select("#playerSelect").property("value");
    const season = +d3.select("#seasonSelect").property("value");
  
    const filtered = data.filter(d => d.Player === player && d.Season === season);
    if (filtered.length === 0) return;
    const playerRow = filtered[0];
  
    drawMap(player);
    drawComparison(playerRow);
    drawPie(playerRow);
    // Update player image and info
    d3.select("#playerPhoto").attr("src", `images/players/${playerRow.Player}.jpg`);
    d3.select("#playerSidePhoto").attr("src", `images/players/${playerRow.Player}.jpg`);
    d3.select("#playerName").text(playerRow.Player);
    d3.select("#playerDetails").html(`
      <strong>Team:</strong> ${playerRow.Team} (${playerRow.Season})<br>
      <strong>Position:</strong> ${playerRow.Pos}<br>
      <strong>Points:</strong> ${playerRow.Points} | 
      <strong>Rebounds:</strong> ${playerRow.TRB} | 
      <strong>Assists:</strong> ${playerRow.AST}
    `);

  }
  
  function drawMap(player) {
    const svg = d3.select("#map");
    svg.selectAll("*").remove();
  
    const width = +svg.attr("width");
    const height = +svg.attr("height");
  
    const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000);
    const path = d3.geoPath().projection(projection);
  
    // Load and draw the map
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
      const states = topojson.feature(us, us.objects.states).features;
  
      svg.append("g")
        .selectAll("path")
        .data(states)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#999");
  
      // Plot team cities
      const playerTeams = data.filter(d => d.Player === player).map(d => d.Team);
      const cities = Array.from(new Set(playerTeams)).map(code => TEAM_MAP[code]).filter(Boolean);
  
      svg.selectAll("circle")
        .data(cities)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", 6)
        .attr("fill", "#4e79a7")
        .append("title")
        .text(d => d.city);
    });
  }
  
    
  function drawComparison(playerRow) {
    
    const svg1 = d3.select("#pointsMinutes").selectAll("*").remove();
    const svg2 = d3.select("#rebounds").selectAll("*").remove();
    
  
    const sameSeason = data.filter(d => d.Season === playerRow.Season);
  
    // Find most similar player (closest Points)
    const similar = sameSeason.reduce((acc, cur) => {
      if (cur.Player !== playerRow.Player) {
        const diff = Math.abs(cur.Points - playerRow.Points);
        if (!acc || diff < Math.abs(acc.Points - playerRow.Points)) acc = cur;
      }
      return acc;
    }, null);
  
    // Find teammate with same position
    const teammate = sameSeason.find(d => d.Team === playerRow.Team && d.Pos === playerRow.Pos && d.Player !== playerRow.Player);
  
  
    const compareData = [playerRow, similar, teammate].filter(Boolean);
    const labels = ["Selected", "Similar", "Teammate"];
    const names = compareData.map(p => p.Player);

    // 👤 Player name labels
    d3.select("#compareLabels").html(`
      🔹 <strong>Selected:</strong> ${names[0] || "N/A"} &nbsp;&nbsp;
      🔸 <strong>Similar:</strong> ${names[1] || "N/A"} &nbsp;&nbsp;
      👥 <strong>Teammate:</strong> ${names[2] || "N/A"}
    `);

    // 📋 Player summary cards
    const summaryHTML = compareData.map((p, i) => `
      <div style="flex:1; background:white; padding:15px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1); text-align:left;">
        <h3 style="margin:0 0 10px 0;">${labels[i]}</h3>
        <p><strong>${p.Player}</strong> — ${p.Team} (${p.Season})</p>
        <p><b>Pos:</b> ${p.Pos}</p>
        <p><b>Points:</b> ${p.Points}</p>
        <p><b>Minutes:</b> ${p.MP}</p>
        <p><b>Rebounds:</b> ${p.TRB}</p>
        <p><b>Assists:</b> ${p.AST}</p>
        <p><b>FG%:</b> ${(p["FG%"] * 100).toFixed(1)}%</p>
      </div>
    `).join("");

    d3.select("#teammate-info").html(summaryHTML.includes("Teammate") ? summaryHTML.split('</div>')[2] + '</div>' : "<p>No teammate found.</p>");
    d3.select("#similar-player-info").html(summaryHTML.includes("Similar") ? summaryHTML.split('</div>')[1] + '</div>' : "<p>No similar player found.</p>");
    


    d3.select("#compareLabels").html(`
      🔹 <strong>Selected:</strong> ${names[0] || "N/A"} &nbsp;&nbsp;
      🔸 <strong>Similar:</strong> ${names[1] || "N/A"} &nbsp;&nbsp;
      👥 <strong>Teammate:</strong> ${names[2] || "N/A"}
    `);
  
    // Bar chart for Points and MP
    const svgPM = d3.select("#pointsMinutes");
    const w = +svgPM.attr("width"), h = +svgPM.attr("height"), m = 40;
    const x = d3.scaleBand().domain(labels).range([m, w - m]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(compareData, d => Math.max(d.Points, d.MP))]).range([h - m, m]);

    svgPM.append("text")
      .attr("x", w / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Points vs Minutes Played");

    svgPM.append("g").attr("transform", `translate(0,${h - m})`).call(d3.axisBottom(x));
    svgPM.append("g").attr("transform", `translate(${m},0)`).call(d3.axisLeft(y));
  
    svgPM.selectAll(".bar")
      .data(compareData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(labels[i]))
      .attr("y", d => y(d.Points))
      .attr("width", x.bandwidth() / 2)
      .attr("height", d => y(0) - y(d.Points))
      .attr("fill", "#59a14f");
  
    svgPM.selectAll(".line")
      .data(compareData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(labels[i]) + x.bandwidth() / 2)
      .attr("y", d => y(d.MP))
      .attr("width", x.bandwidth() / 2)
      .attr("height", d => y(0) - y(d.MP))
      .attr("fill", "#edc949");
  
    // Bar chart for TRB
    const svgTRB = d3.select("#rebounds");
    const y2 = d3.scaleLinear().domain([0, d3.max(compareData, d => d.TRB)]).range([h - m, m]);
    svgTRB.append("g").attr("transform", `translate(0,${h - m})`).call(d3.axisBottom(x));
    svgTRB.append("g").attr("transform", `translate(${m},0)`).call(d3.axisLeft(y2));
    
    svgTRB.append("text")
    .attr("x", w / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Total Rebounds Comparison");

    svgTRB.selectAll(".bar")
      .data(compareData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(labels[i]))
      .attr("y", d => y2(d.TRB))
      .attr("width", x.bandwidth())
      .attr("height", d => y2(0) - y2(d.TRB))
      .attr("fill", "#4e79a7");
  }
  
  function drawPie(playerRow) {
    const svg = d3.select("#pieChart");
    svg.selectAll("*").remove();
    
    



    const totalPoints = playerRow.Points;
    const p2 = playerRow["2P"] * 2;
    const p3 = playerRow["3P"] * 3;
    const p4 = playerRow["Points"] - playerRow["3P"] * 3 - playerRow["2P"] * 2;
    const pieData = [
      { label: "2P Points", value: p2 },
      { label: "3P Points", value: p3 },
      { label: "Free Throws",value: p4 }
    ];
  
    const w = +svg.attr("width"), h = +svg.attr("height");
    const radius = Math.min(w, h) / 2 - 10;
  
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const color = d3.scaleOrdinal(["#59a14f", "#edc949", "#4646E4"]);
  
    const g = svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  
    svg.append("text")
      .attr("x", w / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Scoring Breakdown: 2P, 3P, FT");
    
      
    g.selectAll("path")
      .data(pie(pieData))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.label))
      .append("title")
      .text(d => `${d.data.label}: ${((d.data.value / totalPoints) * 100).toFixed(1)}%`);
  }

// Search Bar Feature
const openBtn = document.getElementById('openSearch');
const overlay = document.getElementById('overlay');
const popup = document.getElementById('searchPopup');
const searchInput = document.getElementById('searchInput');
const suggestionsBox = document.getElementById('suggestions');

let names = [];

// Fetch and parse only the first column (name)
fetch('../EDA NBA/nba_player_stats_C_Rami.csv')
  .then(res => res.text())
  .then(data => {
    const lines = data.split('\n');
    names = lines.map(line => line.split(',')[0].trim()).filter(n => n);
  });


  
// Show popup
openBtn.addEventListener('click', () => {
  overlay.classList.remove('hidden');
  popup.classList.remove('hidden');
  searchInput.value = '';
  searchInput.focus();
  suggestionsBox.innerHTML = '';
});

// Hide popup when clicking outside
overlay.addEventListener('click', () => {
  overlay.classList.add('hidden');
  popup.classList.add('hidden');
});

// Live filter suggestions
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = names.filter(name => name.toLowerCase().includes(query)).slice(0, 10);
  suggestionsBox.innerHTML = filtered.map(name => `<li>${name}</li>`).join('');
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = names.filter(name => name.toLowerCase().includes(query)).slice(0, 10);

  // Clear previous suggestions
  suggestionsBox.innerHTML = '';

  // Create clickable suggestions
  filtered.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.addEventListener('click', () => {
      searchInput.value = name;
      overlay.classList.add('hidden');
      popup.classList.add('hidden');
      suggestionsBox.innerHTML = '';
    
      // Select the name in the hidden player dropdown
      d3.select("#playerSelect").property("value", name);
    
      // Update season dropdown based on this player
      updateSeasonOptions();
    
      // Automatically select the latest season
      const seasonOptions = d3.select("#seasonSelect").selectAll("option").nodes();
      if (seasonOptions.length > 0) {
        const lastSeason = seasonOptions[seasonOptions.length - 1].value;
        d3.select("#seasonSelect").property("value", lastSeason);
      }
    
      // Trigger the full dashboard update
      updateAll();
    });
    
    suggestionsBox.appendChild(li);
  });
});
