// The following file is linked with the dashboard html file

// We are providing information on the Basket Ball club to plot them on a graph
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
  d3.csv("../EDA NBA/nba_player_stats_cleaned_v1.1.0.csv", d3.autoType).then(dataset => {
    data = dataset;
  
    const players = Array.from(new Set(data.map(d => d.Player))).sort();
  
    const playerSelect = d3.select("#playerSelect");

    updateAll("LeBron James", 2020); // Automatic pre-fill
  
    playerSelect.selectAll("option")
      .data(players)
      .enter()
      .append("option")
      .text(d => d);
  
    playerSelect.on("change", () => {
      updateSeasonOptions();
      updateAll();
    });
    });
  
  function updateAll(p = null, s = null) {
    const player = p ?? d3.select("#playerSelect").property("value");
    const season = s ?? null;
  
    if (!player || !season) return;
  
    const filtered = data.filter(d => d.Player === player && d.Season === season);
    if (filtered.length === 0) return;
  
    const playerRow = filtered[0];
  
    drawMap(player);
    drawComparison(playerRow);
    drawPie(playerRow);
    drawPlayerRadar(playerRow);

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

    const wikiName = playerRow.Player.replace(" ", "_");

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiName}`)
      .then(response => response.json())
      .then(data => {
        if (data.extract && data.thumbnail) {
          d3.select("#playerPhoto").attr("src", data.thumbnail.source);
          d3.select("#playerDetails").html(`
            <strong><a href="${data.content_urls.desktop.page}" target="_blank">${data.title}</a></strong><br>
            ${data.extract}
          `);
        } else {
          fallbackPlayerInfo(); // fallback if not found
        }
      })
      .catch(() => fallbackPlayerInfo());  // handle errors
  }

  function fallbackPlayerInfo() {
    d3.select("#playerPhoto").attr("src", "images/players/placeholder.jpg");
    d3.select("#playerDetails").html(`
      <strong>${playerRow.Player}</strong><br>
      Team: ${playerRow.Team} (${playerRow.Season})<br>
      Position: ${playerRow.Pos}<br>
      Points: ${playerRow.Points} | Rebounds: ${playerRow.TRB} | Assists: ${playerRow.AST}
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
    d3.select("#radio-chart").selectAll("*").remove();
  
    const sameSeason = data.filter(d => d.Season === playerRow.Season);
  
    const similar = sameSeason.reduce((acc, cur) => {
      if (cur.Player !== playerRow.Player) {
        const diff = Math.abs(cur.Points - playerRow.Points);
        if (!acc || diff < Math.abs(acc.Points - playerRow.Points)) acc = cur;
      }
      return acc;
    }, null);
  
    const teammate = sameSeason.find(d => d.Team === playerRow.Team && d.Pos === playerRow.Pos && d.Player !== playerRow.Player);
  
    const compareData = [playerRow, similar, teammate].filter(Boolean);
    const labels = ["Selected", "Similar", "Teammate"];
    const names = compareData.map(p => p.Player);
  
    // Show summary cards
    const summaryHTML = compareData.map((p, i) => `
      <div style="flex:1; background:white; padding:15px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1); text-align:left;">
        <h3>${labels[i]}</h3>
        <p><strong>${p.Player}</strong> — ${p.Team} (${p.Season})</p>
        <p><b>Pos:</b> ${p.Pos}</p>
        <p><b>Points:</b> ${p.Points}</p>
        <p><b>Minutes:</b> ${p.MP}</p>
        <p><b>Rebounds:</b> ${p.TRB}</p>
        <p><b>Assists:</b> ${p.AST}</p>
        <p><b>FG%:</b> ${(p["FG%"] * 100).toFixed(1)}%</p>
      </div>
    `).join("");
  
        // SIMILAR PLAYER INFO
    if (similar) {
      const wikiName = similar.Player.replace(" ", "_");
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiName}`)
        .then(res => res.json())
        .then(data => {
          if (data.thumbnail) {
            d3.select("#Similar_player_picture").attr("src", data.thumbnail.source);
          }
          d3.select("#similar-player-info").html(`
            <strong><a href="${data.content_urls.desktop.page}" target="_blank">${data.title}</a></strong><br>
            ${data.extract}
          `);
        })
        .catch(() => {
          d3.select("#similar-player-info").html(`${similar.Player}, ${similar.Team} (${similar.Season})`);
        });
    }

    // TEAMMATE INFO
    if (teammate) {
      const wikiName = teammate.Player.replace(" ", "_");
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiName}`)
        .then(res => res.json())
        .then(data => {
          if (data.thumbnail) {
            d3.select("#Teammate_picture").attr("src", data.thumbnail.source);
          }
          d3.select("#teammate-info").html(`
            <strong><a href="${data.content_urls.desktop.page}" target="_blank">${data.title}</a></strong><br>
            ${data.extract}
          `);
        })
        .catch(() => {
          d3.select("#teammate-info").html(`${teammate.Player}, ${teammate.Team} (${teammate.Season})`);
        });
    }

    
  
    // Radar Chart Stats
    const stats = ["uPER", "TS%", "FT%", "PIE", "FG%"];
    const radarData = compareData.map(p => ({
      name: p.Player,
      values: stats.map(stat => stat === "PIE" ? (p["PIE"]*1000) : p[stat])
    }));
  
    const svg = d3.select("#radio-chart");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const radius = Math.min(width, height) / 2 - 40;
  
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
  
    const angleSlice = (2 * Math.PI) / stats.length;
  
    // Scales
    const maxValue = d3.max(radarData.flatMap(d => d.values));
    const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
  
    // Radar grid lines
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const r = radius * (level / levels);
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#ccc");
    }
  
    // Axis lines and labels
    stats.forEach((stat, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = rScale(maxValue) * Math.cos(angle);
      const y = rScale(maxValue) * Math.sin(angle);
  
      g.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", x).attr("y2", y)
        .attr("stroke", "#aaa");
  
      g.append("text")
        .attr("x", x * 1.1)
        .attr("y", y * 1.1)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text(stat);
    });
  
    // Radar paths
    const line = d3.lineRadial()
      .radius(d => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
  
    const color = d3.scaleOrdinal(d3.schemeCategory10);
  
    radarData.forEach((player, i) => {
      g.append("path")
        .datum(player.values.map((v, j) => ({ axis: stats[j], value: v })))
        .attr("fill", color(i))
        .attr("fill-opacity", 0.1)
        .attr("stroke", color(i))
        .attr("stroke-width", 2)
        .attr("d", line);
    });
  
    // Legend (optional)
    const legend = svg.append("g")
      .attr("transform", `translate(20, 20)`);
  
    radarData.forEach((d, i) => {
      legend.append("circle")
        .attr("cx", 0)
        .attr("cy", i * 20)
        .attr("r", 5)
        .attr("fill", color(i));
  
      legend.append("text")
        .attr("x", 10)
        .attr("y", i * 20 + 5)
        .text(labels[i])
        .style("font-size", "12px");
    });
      // =============== REBOUND BAR CHART ================
    const svgTRB = d3.select("#rebounds");
    svgTRB.selectAll("*").remove();

    const w = +svgTRB.attr("width");
    const h = +svgTRB.attr("height");
    const margin = 40;

    const x = d3.scaleBand()
      .domain(labels)
      .range([margin, w - margin])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(compareData, d => d.TRB)])
      .range([h - margin, margin]);

    // Axis
    svgTRB.append("g")
      .attr("transform", `translate(0, ${h - margin})`)
      .call(d3.axisBottom(x));

    svgTRB.append("g")
      .attr("transform", `translate(${margin}, 0)`)
      .call(d3.axisLeft(y));

    // Title
    svgTRB.append("text")
      .attr("x", w / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Total Rebounds Comparison");

    // Bars
    svgTRB.selectAll(".bar")
      .data(compareData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(labels[i]))
      .attr("y", d => y(d.TRB))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.TRB))
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
// fetch('../EDA NBA/nba_player_stats_C_Rami.csv')
//   .then(res => res.text())
//   .then(data => {
//     const lines = data.split('\n');
//     names = lines.map(line => line.split(',')[0].trim()).filter(n => n);
//   });

// Fetch and parse Player, Season combinations
fetch('../EDA NBA/nba_player_stats_C_Rami.csv')
  .then(res => res.text())
  .then(data => {
    const lines = data.split('\n').slice(1); // Skip header
    const seen = new Set();
    names = lines.map(line => {
      const parts = line.split(',');
      const player = parts[0]?.trim();
      const season = parts.at(-1)?.trim();  // last column is likely Season
      const combined = `${player}, ${season}`;
      if (player && season && !seen.has(combined)) {
        seen.add(combined);
        return combined;
      }
      return null;
    }).filter(Boolean);
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
  const filtered = names.filter(pair => pair.toLowerCase().includes(query)).slice(0, 10);
  suggestionsBox.innerHTML = '';

  filtered.forEach(nameSeason => {
    const li = document.createElement('li');
    li.textContent = nameSeason;
    li.addEventListener('click', () => {
      searchInput.value = nameSeason;
      overlay.classList.add('hidden');
      popup.classList.add('hidden');
      suggestionsBox.innerHTML = '';

      const [player, season] = nameSeason.split(',').map(s => s.trim());

      d3.select("#playerSelect").property("value", player);
      setTimeout(() => {
        updateAll(player, +season);
      }, 50);
      
    });
    suggestionsBox.appendChild(li);
  });
});



function drawPlayerRadar(playerRow) {
  const svg = d3.select("#player_solo_radiograph");
  svg.selectAll("*").remove();

  const stats = ["uPER", "TS%", "FT%", "PIE", "eFG%","FT%"];
  const values = stats.map(stat => stat === "PIE" ? (playerRow[stat] * 1000) : playerRow[stat]);

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const radius = Math.min(width, height) / 2 - 40;
  const angleSlice = (2 * Math.PI) / stats.length;
  const maxValue = d3.max(values);
  const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Grid circles
  for (let level = 1; level <= 5; level++) {
    const r = radius * (level / 5);
    g.append("circle")
      .attr("r", r)
      .attr("fill", "none")
      .attr("stroke", "#ccc");
  }

  // Axes
  stats.forEach((stat, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = rScale(maxValue) * Math.cos(angle);
    const y = rScale(maxValue) * Math.sin(angle);

    g.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", x).attr("y2", y)
      .attr("stroke", "#aaa");

    g.append("text")
      .attr("x", x * 1.1)
      .attr("y", y * 1.1)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text(stat);
  });

  // Radar path
  const radarLine = d3.lineRadial()
    .radius((d, i) => rScale(d))
    .angle((d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed);

  g.append("path")
    .datum(values)
    .attr("d", radarLine)
    .attr("fill", "#1f77b4")
    .attr("fill-opacity", 0.3)
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2);

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(`${playerRow.Player} Radar`);
}
