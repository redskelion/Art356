// Shelf of Games — all statistics come from games.csv.
let games = [], page = 'Overview', region = 'Global', platform = 'All Consoles';
let selectedGame = null, loadState = 'Loading games.csv...', pageNumber = 0;
let transitionStart = 0, soundEnabled = true, audioContext = null, themeColor = '#a36cff';
let lastShelfKey = '';
const consoleColors = {Wii:'#ef665f',DS:'#ee675e',NES:'#f06b60',SNES:'#f06b60',N64:'#ef665f',GB:'#e65b62',GBA:'#e85b62',GC:'#d96dff',Switch:'#f05656',PS:'#5e9fff',PS2:'#5e9fff',PS3:'#5e9fff',PS4:'#5e9fff',PSP:'#5e9fff',PSV:'#5e9fff',X360:'#5de596',XB:'#5de596',XOne:'#5de596',PC:'#bd8cff'};
let platformSelect, regionSelect;
const tabs = ['Overview','Top Games','Releases','All Games','Game Details'];
let previousPage = 'Overview', recordsPage = 0, searchText = '', sortMode = 'sales';
const RECORDS_PER_PAGE = 35;
const shelfSize = 7;
let rankingSearch = '', rankingPage = 0;
const RANKING_PAGE_SIZE = 50;
// Real cover images are used where a verified URL is available.
// Other game/console combinations show an illustrated fallback, not fake cover art.
const coverArt = {
  'Wii Sports|Wii': 'https://media.gamestop.com/i/gamestop/10065517/Wii-Sports---Nintendo-Wii?fmt=auto&h=768&w=768',
  'Super Mario Bros.|NES': 'https://m.media-amazon.com/images/M/MV5BZDg5NGYxOGEtMTc2NC00NTZiLThjNjQtYTM3Mzg0MTBhNjFkXkEyXkFqcGc%40._V1_.jpg',
  'Mario Kart Wii|Wii': 'https://retrofam.com/cdn/shop/files/jz3n9dwwmmukj2i1ubxs.webp?v=1749815643',
  'Wii Sports Resort|Wii': 'https://ak-asset.jarir.com/akeneo-prod/asset/m1images/3/9/396535.jpg',
  'Pokemon Red/Pokemon Blue|GB': 'https://retroislandny.com/cdn/shop/files/pokemon-red-gameboy-763539.jpg?v=1770006534&width=1780',
  'Tetris|GB': 'https://images.launchbox-app.com/e5075683-56fd-4ae2-b900-07ba098b80ae.jpg',
  'New Super Mario Bros.|DS': 'https://retronorthgames.com/cdn/shop/files/New_Super_Mario_Bros._DS.jpg?v=1772744310&width=1946'
};

// Object-oriented programming: every CSV row becomes a Game object.
class Game {
  constructor(row) {
    this.name = row.getString('Name');
    this.platform = row.getString('Platform');
    this.year = Number(row.getString('Year_of_Release')) || 0;
    this.genre = row.getString('Genre') || 'Unknown';
    this.publisher = row.getString('Publisher') || 'Unknown';
    this.developer = row.getString('Developer') || 'Unknown';
    this.rating = row.getString('Rating') || 'N/A';
    this.critic = row.getString('Critic_Score') || 'N/A';
    this.user = row.getString('User_Score') || 'N/A';
    this.criticCount = row.getString('Critic_Count') || 'N/A';
    this.userCount = row.getString('User_Count') || 'N/A';
    this.sales = {
      Global: Number(row.getString('Global_Sales')) || 0,
      'North America': Number(row.getString('NA_Sales')) || 0,
      Europe: Number(row.getString('EU_Sales')) || 0,
      Japan: Number(row.getString('JP_Sales')) || 0,
      Other: Number(row.getString('Other_Sales')) || 0
    };
  }
  value() { return this.sales[region]; }
}
function setup() {
  let c = createCanvas(920, 560);
  c.parent('canvas-container');
  textFont('Trebuchet MS');
  platformSelect = select('#console-select');
  regionSelect = select('#region-select');
  document.querySelectorAll('[data-tv-tab]').forEach(btn => btn.addEventListener('click', () => changePage(btn.dataset.tvTab)));
  setupDatabase();
  setupRanking();
  syncTabs();
  loadTable('games.csv','csv','header',loaded,failed);
}
function loaded(table) {
  for (let i=0; i<table.getRowCount(); i++) {
    let g = new Game(table.getRow(i));
    if (g.name && g.platform) games.push(g);
  }
  if (!games.length) { loadState='CSV has no usable game rows.'; return; }
  loadState='Ready';
  platformSelect.option('All Consoles');
  [...new Set(games.map(g=>g.platform))].sort().forEach(p=>platformSelect.option(p));
  ['Global','North America','Europe','Japan','Other'].forEach(r=>regionSelect.option(r));
  platformSelect.changed(() => {platform=platformSelect.value(); recordsPage=0; rankingPage=0; transitionStart=millis(); applyTheme(); renderDatabase(); renderRanking();});
  regionSelect.changed(() => {region=regionSelect.value(); rankingPage=0; transitionStart=millis(); renderDatabase(); renderRanking();});
  selectedGame = [...games].sort((a,b)=>b.sales.Global-a.sales.Global)[0];
  applyTheme();
  updateShelf();
  renderRanking();
  console.log('Loaded '+games.length+' game records.');
}
function failed(error) { loadState='Could not load games.csv — check Live Server and file name.'; console.error(error); }
function filtered() { return games.filter(g=>platform==='All Consoles'||g.platform===platform); }
function sorted() { return filtered().sort((a,b)=>b.value()-a.value()); }
// Shelf: real artwork only. Never fabricate or substitute cover images.
// The top 7 games are ranked globally from CSV, regardless of selected console. Missing images are
// skipped visually and reported; see covers/README.txt to add exact artwork.
const coverFiles = {}; // e.g. coverFiles['Wii Sports|Wii']='covers/wii-sports-wii.jpg';
const libretroPlatforms = {
  Wii:'Nintendo - Wii',DS:'Nintendo - Nintendo DS',NES:'Nintendo - Nintendo Entertainment System',
  SNES:'Nintendo - Super Nintendo Entertainment System',N64:'Nintendo - Nintendo 64',
  GB:'Nintendo - Game Boy',GBA:'Nintendo - Game Boy Advance',GC:'Nintendo - GameCube',
  PS:'Sony - PlayStation',PS2:'Sony - PlayStation 2',PSP:'Sony - PlayStation Portable',
  X360:'Microsoft - Xbox 360',XB:'Microsoft - Xbox',PC:'Microsoft - Windows',
  PS3:'Sony - PlayStation 3',PS4:'Sony - PlayStation 4',PSV:'Sony - PlayStation Vita'
};
function coverCandidates(g) {
  const key=g.name+'|'+g.platform;
  const result=[];
  if(coverFiles[key])result.push(coverFiles[key]);
  if(coverArt[key])result.push(coverArt[key]);
  const system=libretroPlatforms[g.platform];
  if(system){
    const clean=n=>n.replace(/[&*/:`<>?\\|]/g,'_');
    for(const n of [g.name,g.name+' (USA)',g.name+' (Europe)',g.name+' (USA, Europe)']) {
      result.push('https://raw.githubusercontent.com/libretro-thumbnails/'+encodeURIComponent(system)+'/master/Named_Boxarts/'+encodeURIComponent(clean(n))+'.png');
    }
  }
  return result;
}
function updateShelf() {
  // Fixed shelf: top seven global-selling CSV records, independent of TV filters.
  const top=[...games].sort((a,b)=>b.sales.Global-a.sales.Global).slice(0,shelfSize);
  const shelf=document.getElementById('shelf');
  shelf.replaceChildren();shelf.classList.remove('shelf-refresh');void shelf.offsetWidth;shelf.classList.add('shelf-refresh');
  const count=document.getElementById('shelf-count');
  count.textContent='ALL-TIME TOP 7 · LOADING COVERS';
  let visible=0, finished=0;
  for(const g of top){
    const urls=coverCandidates(g);
    const button=document.createElement('button');button.className='case';
    button.title=g.name+' — '+g.platform+' — '+g.sales.Global.toFixed(2)+'M global';
    button.setAttribute('aria-label','View '+g.name+' data');
    button.style.display='none';
    const img=document.createElement('img');img.alt='Game cover: '+g.name+' ('+g.platform+')';
    img.loading='eager';
    let idx=0;
    const tryNext=()=>{
      if(idx>=urls.length){finished++;setCount();return;}
      img.src=urls[idx++];
    };
    const setCount=()=>{count.textContent=visible+'/7 REAL COVERS LOADED';};
    img.onload=()=>{button.style.display='block';visible++;finished++;setCount();};
    img.onerror=tryNext;
    button.appendChild(img);
    button.addEventListener('click',()=>{if(page!=='Game Details')previousPage=page;selectedGame=g;changePage('Game Details');applyTheme();playGameSound(g);document.querySelectorAll('.case').forEach(b=>b.classList.remove('active'));button.classList.add('active');renderDetails();});
    shelf.appendChild(button);
    tryNext();
  }
}
function syncTabs() {
  document.querySelectorAll('[data-tv-tab]').forEach(btn => {
    const active=btn.dataset.tvTab===page;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  });
}
function draw() {
  background('#0b1125');
  noStroke();
  if(loadState!=='Ready') {fill('white');textSize(19);text(loadState,30,90);return;}
  push();
  drawingContext.save();
  drawingContext.beginPath();drawingContext.rect(0,0,width,520);drawingContext.clip();
  const elapsed=(millis()-transitionStart)/420;
  const progress=constrain(elapsed,0,1);
  const eased=1-Math.pow(1-progress,3);
  translate((1-eased)*24,-190); // Move charts into visible TV area
  drawingContext.globalAlpha=0.15+0.85*eased;
  if(page==='Overview') overview();
  else if(page==='Top Games') topGames();
  else if(page==='Releases') releases();
  drawingContext.restore();
  pop();
  fill('#91a5c9');textSize(12);
  text('CSV: '+games.length.toLocaleString()+' records | Sales in millions | Select a cover for game details',25,545);
}
function panelTitle(title,subtitle) {fill('white');textSize(21);textStyle(BOLD);text(title,25,236);textStyle(NORMAL);fill('#a8b9d6');textSize(13);text(subtitle,25,258);}
function overview() {
  let list=filtered(), total=list.reduce((s,g)=>s+g.value(),0);
  panelTitle('Collection Overview','Statistics recalculate for the selected console and region.');
  card(25,278,270,'GAME RECORDS',list.length.toLocaleString());
  card(315,278,270,'TOTAL SALES',total.toFixed(1)+'M');
  card(605,278,270,'CONSOLES',new Set(list.map(g=>g.platform)).size);
  fill('#d9e7ff');textSize(17);text('TOP GENRES BY SALES',25,405);
  let sums={};for(let g of list)sums[g.genre]=(sums[g.genre]||0)+g.value();
  let genres=Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0,5);
  let max=genres.length?genres[0][1]:1;
  const reveal=constrain((millis()-transitionStart)/750,0,1);
  for(let i=0;i<genres.length;i++){
    let y=425+i*19;fill('#c7d6ed');textSize(12);text(genres[i][0],25,y+12);
    fill('#20365c');rect(140,y,440,13,3);fill('#64c5e8');rect(140,y,440*genres[i][1]/max*reveal,13,3);
    fill('#e5f0ff');text(genres[i][1].toFixed(1)+'M',600,y+12);
  }
}
function card(x,y,w,label,value) {fill('#1e2e51');rect(x,y,w,96,10);fill('#9fbde0');textSize(13);text(label,x+16,y+26);fill('white');textSize(28);textStyle(BOLD);text(value,x+16,y+70);textStyle(NORMAL);}
function topGames() {
  panelTitle('Top 10 Best-Selling Games','Bar length represents sales in the selected region.');
  let top=sorted().slice(0,10), max=top.length?top[0].value():1;
  const reveal=constrain((millis()-transitionStart)/850,0,1);
  for(let i=0;i<top.length;i++){
    let g=top[i], y=274+i*24;
    fill('#dceaff');textSize(12);text((i+1)+'. '+g.name.substring(0,30),25,y+14);
    fill('#223556');rect(285,y,455,17,3);fill(i%2?'#ad8dff':'#4fc7e7');rect(285,y,max?455*g.value()/max*reveal:0,17,3);
    fill('white');text(g.value().toFixed(2)+'M',758,y+14);
  }
}
function releases() {
  panelTitle('Release Year Bubble Chart','Each bubble is a game; size represents sales. Hover to inspect.');
  let list=sorted().filter(g=>g.year>=1980&&g.year<=2016).slice(0,160);
  let max=list.length?list[0].value():1, hovered=null;
  stroke('#51688d');line(65,485,875,485);noStroke();
  for(let yr=1980;yr<=2016;yr+=6){let x=map(yr,1980,2016,65,875);fill('#a4b9d8');textSize(12);text(yr,x-16,506);}
  const reveal=constrain((millis()-transitionStart)/850,0,1);
  for(let i=list.length-1;i>=0;i--){let g=list[i];let x=map(g.year,1980,2016,65,875),y=293+(i%7)*25;let d=map(g.value(),0,max,5,29);fill(90+(i%3)*35,135,235,145);circle(x,y,d*reveal);if(dist(mouseX,mouseY,x,y)<d*reveal/2)hovered=g;}
  if(hovered){fill('#1d3357');rect(25,512,840,25,5);fill('white');textSize(13);text(hovered.name.substring(0,55)+' | '+hovered.platform+' | '+hovered.year+' | '+hovered.value().toFixed(2)+'M',36,529);}
}
function details(){
  let g=selectedGame;
  panelTitle('Selected Game','Click a case on the shelf above to inspect another title.');
  if(!g)return;
  fill('#dbeaff');textSize(23);textStyle(BOLD);text(g.name.substring(0,50),25,307);textStyle(NORMAL);
  let info=[['PLATFORM',g.platform],['RELEASE YEAR',g.year||'Unknown'],['GENRE',g.genre],['PUBLISHER',g.publisher.substring(0,28)]];
  for(let i=0;i<info.length;i++){let x=25+(i%2)*445,y=333+Math.floor(i/2)*66;fill('#203254');rect(x,y,420,56,8);fill('#a9c3e3');textSize(12);text(info[i][0],x+12,y+20);fill('white');textSize(16);text(info[i][1],x+12,y+43);}
  fill('#80e6f6');textSize(21);text(region+' sales: '+g.value().toFixed(2)+' million',25,500);
}
function shorten(s,n){return s.length>n?s.slice(0,n-1)+'…':s;}
// Smooth TV page transitions and console/game color themes.
function changePage(next) {
  if(next==='Game Details' && page!=='Game Details')previousPage=page;
  page = next;
  transitionStart = millis();
  applyTheme();
  syncTabs();
  const canvas=document.getElementById('canvas-container');
  const db=document.getElementById('all-games-panel');
  const detail=document.getElementById('details-panel');
  const ranking=document.getElementById('top-ranking-panel');
  canvas.hidden=(next==='All Games'||next==='Game Details');
  db.hidden=next!=='All Games';
  detail.hidden=next!=='Game Details';
  ranking.hidden=next!=='Top Games';
  if(next==='Top Games')renderRanking();
  if(next==='All Games')renderDatabase();
  if(next==='Game Details')renderDetails();
}
function applyTheme() {
  const base = consoleColors[platform] || '#a36cff';
  // Selected game adds a genre-specific accent while console controls the room's base color.
  const genreColors = {Racing:'#ffb34c',Sports:'#65d8f6',Shooter:'#6ce0ad',Action:'#fa7e91',Platform:'#ffcc66',RolePlaying:'#c29bff',Puzzle:'#7be6e6',Adventure:'#9ec9ff'};
  const accent = selectedGame && page === 'Game Details' ? (genreColors[selectedGame.genre] || base) : base;
  themeColor = accent;
  document.documentElement.style.setProperty('--console-glow',base);
  document.documentElement.style.setProperty('--game-glow',accent);
  document.body.dataset.console = platform;
  const label=document.getElementById('theme-label');
  if(label)label.textContent=(selectedGame && page === 'Game Details' ? selectedGame.name+' • ' : '')+(platform==='All Consoles'?'ALL CONSOLES':platform)+' THEME';
}

// Short, original game-specific synthesized selection effects.
// No copyrighted game recordings are included.
function playGameSound(game) {
  if(!soundEnabled)return;
  try {
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    if(!audioContext)audioContext=new AudioCtx();
    if(audioContext.state==='suspended')audioContext.resume();
    let hash=0;
    for(const char of game.name+'|'+game.platform)hash=((hash*31)+char.charCodeAt(0))>>>0;
    const now=audioContext.currentTime;
    const tones=[0,3,7,10,12,15,19];
    for(let i=0;i<3;i++){
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();
      const note=tones[(hash+i*3)%tones.length];
      const freq=220*Math.pow(2,note/12);
      osc.type=['sine','triangle','square'][(hash+i)%3];
      osc.frequency.setValueAtTime(freq,now+i*.105);
      gain.gain.setValueAtTime(.0001,now+i*.105);
      gain.gain.exponentialRampToValueAtTime(.055,now+i*.105+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,now+i*.105+.16);
      osc.connect(gain);gain.connect(audioContext.destination);
      osc.start(now+i*.105);osc.stop(now+i*.105+.17);
    }
  }catch(e){console.warn('Sound unavailable:',e);}
}
function toggleSound(){
  soundEnabled=!soundEnabled;
  const button=document.getElementById('sound-toggle');
  if(button){button.textContent=soundEnabled?'🔊 SOUND ON':'🔇 SOUND OFF';button.setAttribute('aria-pressed',String(soundEnabled));} if(!soundEnabled&&window.activeGameAudio)window.activeGameAudio.pause();
}
window.addEventListener('DOMContentLoaded',()=>{
  const button=document.getElementById('sound-toggle');
  if(button)button.addEventListener('click',toggleSound);
});

// Full searchable CSV browser, including all available columns.
function setupDatabase(){
  document.getElementById('game-search').addEventListener('input',e=>{searchText=e.target.value.toLowerCase();recordsPage=0;renderDatabase();});
  document.getElementById('game-sort').addEventListener('change',e=>{sortMode=e.target.value;recordsPage=0;renderDatabase();});
  document.getElementById('prev-records').addEventListener('click',()=>{recordsPage=Math.max(0,recordsPage-1);renderDatabase();});
  document.getElementById('next-records').addEventListener('click',()=>{recordsPage++;renderDatabase();});
  document.getElementById('back-button').addEventListener('click',()=>changePage(previousPage==='Game Details'?'Overview':previousPage));
}
function matchingRecords(){
  let rows=filtered().filter(g=>[g.name,g.publisher,g.genre,g.developer,g.platform,String(g.year)].some(v=>String(v).toLowerCase().includes(searchText)));
  if(sortMode==='name')rows.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sortMode==='year')rows.sort((a,b)=>b.year-a.year);
  else rows.sort((a,b)=>b.value()-a.value());
  return rows;
}
function renderDatabase(){
  if(loadState!=='Ready')return;
  const rows=matchingRecords();
  const pages=Math.max(1,Math.ceil(rows.length/RECORDS_PER_PAGE));
  recordsPage=Math.min(recordsPage,pages-1);
  document.getElementById('record-count').textContent=`${rows.length.toLocaleString()} games match • ${games.length.toLocaleString()} total CSV records • click a row for details`;
  const body=document.getElementById('game-rows');body.replaceChildren();
  const fields=['name','platform','year','genre','publisher'];
  for(const g of rows.slice(recordsPage*RECORDS_PER_PAGE,(recordsPage+1)*RECORDS_PER_PAGE)){
    const tr=document.createElement('tr');tr.tabIndex=0;
    const values=[...fields.map(k=>g[k]),...['Global','North America','Europe','Japan','Other'].map(r=>g.sales[r].toFixed(2)),g.critic,g.user];
    for(const v of values){const td=document.createElement('td');td.textContent=String(v);tr.appendChild(td);}
    const open=()=>{selectedGame=g;changePage('Game Details');applyTheme();renderDetails();};
    tr.addEventListener('click',open);tr.addEventListener('keydown',e=>{if(e.key==='Enter')open();});body.appendChild(tr);
  }
  document.getElementById('page-status').textContent=`Page ${recordsPage+1} of ${pages}`;
  document.getElementById('prev-records').disabled=recordsPage===0;
  document.getElementById('next-records').disabled=recordsPage>=pages-1;
}
function renderDetails(){
  const el=document.getElementById('details-content');el.replaceChildren();
  if(!selectedGame){el.textContent='Choose a game on the shelf or in All Games.';return;}
  const g=selectedGame;
  const title=document.createElement('h2');title.textContent=g.name;el.appendChild(title);
  const grid=document.createElement('div');grid.className='details-grid';
  const fields=[['Console',g.platform],['Release year',g.year||'Unknown'],['Genre',g.genre],['Publisher',g.publisher],['Developer',g.developer],['Age rating',g.rating],['Global sales',g.sales.Global.toFixed(2)+' million'],['North America',g.sales['North America'].toFixed(2)+' million'],['Europe',g.sales.Europe.toFixed(2)+' million'],['Japan',g.sales.Japan.toFixed(2)+' million'],['Other regions',g.sales.Other.toFixed(2)+' million'],['Critic score',g.critic],['User score',g.user],['Critic reviews',g.criticCount],['User reviews',g.userCount]];
  for(const [label,value] of fields){const box=document.createElement('div');box.className='detail-card';const small=document.createElement('small');small.textContent=label;const strong=document.createElement('strong');strong.textContent=String(value);box.append(small,strong);grid.appendChild(box);}
  el.appendChild(grid);
  const hint=document.createElement('p');hint.textContent='Values come from the original CSV. N/A means the source does not provide that field.';el.appendChild(hint);
}

// Searchable, paginated rankings of ALL game records, under the Top Games chart.
function setupRanking() {
  document.getElementById('ranking-search').addEventListener('input', e => {
    rankingSearch = e.target.value.trim().toLowerCase();
    rankingPage = 0;
    renderRanking();
  });
  document.getElementById('ranking-prev').addEventListener('click', () => {
    rankingPage = Math.max(0, rankingPage - 1);
    renderRanking();
  });
  document.getElementById('ranking-next').addEventListener('click', () => {
    rankingPage++;
    renderRanking();
  });
}
function renderRanking() {
  if (loadState !== 'Ready') return;
  // Assign permanent global ranks BEFORE searching or filtering.
  // The original rank is based on all CSV records and global sales.
  const allRanked = [...games].sort((a, b) => b.sales.Global - a.sales.Global);
  const originalRanks = new Map(allRanked.map((g, i) => [g, i + 1]));
  const rows = allRanked.filter(g =>
    (platform === 'All Consoles' || g.platform === platform) &&
    [g.name, g.platform, g.genre, g.publisher].some(value =>
      String(value).toLowerCase().includes(rankingSearch)
    )
  );
  const pages = Math.max(1, Math.ceil(rows.length / RANKING_PAGE_SIZE));
  rankingPage = Math.min(rankingPage, pages - 1);
  const body = document.getElementById('ranking-rows');
  body.replaceChildren();
  const start = rankingPage * RANKING_PAGE_SIZE;
  rows.slice(start, start + RANKING_PAGE_SIZE).forEach((g, i) => {
    const tr = document.createElement('tr');
    tr.tabIndex = 0;
    [originalRanks.get(g), g.name, g.platform, g.year || 'N/A', g.genre, g.sales.Global.toFixed(2)]
      .forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.appendChild(td); });
    const open = () => { selectedGame = g; changePage('Game Details'); applyTheme(); playGameSound(g); };
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    body.appendChild(tr);
  });
  document.getElementById('ranking-count').textContent = rows.length.toLocaleString() + ' matching records • original rank based on all games (global sales)';
  document.getElementById('ranking-page').textContent = 'Page ' + (rankingPage+1) + ' of ' + pages;
  document.getElementById('ranking-prev').disabled = rankingPage === 0;
  document.getElementById('ranking-next').disabled = rankingPage >= pages - 1;
}
