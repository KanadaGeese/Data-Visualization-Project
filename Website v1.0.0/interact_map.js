const svg = d3.select("#barChart");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 30, right: 30, bottom: 30, left: 200 };

const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left + -90},${margin.top})`);

const seasonDisplay = document.getElementById("seasonDisplay");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

let seasons = [];
let seasonData = {};
let currentSeasonIndex = 0;
let intervalId = null;

d3.csv("../../EDA NBA/nba_player_stats_C_Rami.csv", d3.autoType).then(data => {
  // Build season-player lookup
  seasons = Array.from(new Set(data.map(d => d.Season))).sort();

  seasons.forEach(season => {
    const rows = data.filter(d => d.Season === season);
    const pointsByPlayer = d3.rollups(
      rows,
      v => d3.sum(v, d => d.Points),
      d => d.Player
    );

    seasonData[season] = pointsByPlayer
      .sort((a, b) => d3.descending(a[1], b[1]))
      .slice(0, 10);
  });

  drawSeason(seasons[currentSeasonIndex]);
});

// Draw chart for a given season
function drawSeason(season) {
  const data = seasonData[season];
  const players = data.map(d => d[0]);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[1])])
    .range([0, chartWidth-70]);

  const y = d3.scaleBand()
    .domain(players)
    .range([0, chartHeight])
    .padding(0.2);

  // Update season label
  seasonDisplay.textContent = `Season: ${season}`;

  // Axes
  chart.selectAll("g.axis").remove();
  chart.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));

  // BARS
  const bars = chart.selectAll("rect").data(data, d => d[0]);

  bars.exit().transition().duration(300).attr("width", 0).remove();

  bars.transition()
    .duration(800)
    .attr("y", d => y(d[0]))
    .attr("width", d => x(d[1]))
    .attr("height", y.bandwidth());

  bars.enter()
    .append("rect")
    .attr("y", d => y(d[0]))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", 0)
    .attr("fill", "#1d428a")
    .transition()
    .duration(800)
    .attr("width", d => x(d[1]));

  // LABELS
  const labels = chart.selectAll("text.label").data(data, d => d[0]);

  labels.exit().remove();

  labels
    .transition()
    .duration(800)
    .attr("y", d => y(d[0]) + y.bandwidth() / 2 + 5)
    .attr("x", d => x(d[1]) + 5)
    .text(d => `${d[0]} (${d[1]})`);

  labels.enter()
    .append("text")
    .attr("class", "label")
    .attr("y", d => y(d[0]) + y.bandwidth() / 2 + 5)
    .attr("x", d => x(d[1]) + 5)
    .text(d => `${d[0]} (${d[1]})`)
    .style("fill", "#333");
}

// Playback controls
function nextSeason() {
  if (currentSeasonIndex < seasons.length - 1) {
    currentSeasonIndex++;
    drawSeason(seasons[currentSeasonIndex]);
  }
}

function prevSeason() {
  if (currentSeasonIndex > 0) {
    currentSeasonIndex--;
    drawSeason(seasons[currentSeasonIndex]);
  }
}

function play() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    if (currentSeasonIndex < seasons.length - 1) {
      currentSeasonIndex++;
      drawSeason(seasons[currentSeasonIndex]);
    } else {
      pause(); // stop at end
    }
  }, 1500);
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
}

playBtn.addEventListener("click", play);
pauseBtn.addEventListener("click", pause);
nextBtn.addEventListener("click", nextSeason);
prevBtn.addEventListener("click", prevSeason);
