const canvas = document.
	querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

let rain_sprite = document.getElementById("rain");
let bg_sprite = document.getElementById("bg");
let music_ame = new Audio('rain.mp3');
let animation_handle;
const video = document.querySelector("video");
video.addEventListener('loadeddata', video_load_callback, false);
var lastUpdate = Date.now();
var lastDrop = Date.now();
let mousePos = {
	x: 0,
	y: 0
}

rain_drops = []


mouse_targets = []

level_targets = {}

let score = 0;
let misses = 0;
let create_level_mode = false;

function isInside(pos, rect) {
  return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y
}
function isInsideCircle(pos, pos2, r) {
	dx = (pos.x - pos2.x);
	dy = (pos.y - pos2.y);
	
	return Math.sqrt((dx * dx) + (dy * dy)) < r
}
function getRandom(max)
{
	return (((Math.random() < 0.5) ? -1 : 1) * Math.random() * max)
}
function video_load_callback() {
    video.cancelVideoFrameCallback(animation_handle);
    //step()
}
/*
function step() { // update the canvas when a video proceeds to next frame
	
    c.drawImage(video, 0, 0, canvas.width, canvas.height);
	animate();
	animation_handle = video.requestVideoFrameCallback(step);
}*/
function getInverseColor(pos)
{
	 var imgData = c.getImageData(pos.x, pos.y, 1, 1);
    red = imgData.data[0];
    green = imgData.data[1];
    blue = imgData.data[2];
    alpha = imgData.data[3];
	return "rgba(" + red + "," + green + "," + blue + "," + alpha +")"
}
function animate() {
	animationId = requestAnimationFrame(animate);
	c.clearRect(0,0,canvas.width,canvas.height)
    c.drawImage(video, 0, 0, canvas.width, canvas.height);
	
	c.font = "48px serif";
	c.fillStyle = 'gray';
	c.fillText("Score: " + score, 10, 50);
	c.fillText("Misses: " + misses, 10, 100);
	//c.fillStyle = 'rgba(0,0,0,1)'
	//c.fillRect(0,0,canvas.width,canvas.height)
	//c.drawImage(bg_sprite,0,0, canvas.width, canvas.height);
	var now = Date.now();
    var dt = now - lastUpdate;
    lastUpdate = now;

	mouse_targets.forEach((target,raindropIndex)=> {
		target.update(dt)
		let toDelete = []
		if (!create_level_mode &&  isInsideCircle(mousePos, {x: target.x, y: target.y}, target.radius))// width: target.radius, height: target.radius}))
		{
			score++;
			for (let i=0; i< 5; i++)
			{
				spawnParticle(target.x, target.y, {x: getRandom(3), y: getRandom(3)})
			}
			toDelete.push(raindropIndex);
			/*setTimeout(() => {
					mouse_targets.splice(raindropIndex,1)
			}, 0)*/
		}
		else if (target.time <= 0)
		{
			misses++;
			/*setTimeout(() => {
					mouse_targets.splice(raindropIndex,1)
			}, 0)*/
			toDelete.push(raindropIndex);
		}
		toDelete.forEach((del,raindropIndex2)=> {
			mouse_targets.splice(del,1)
		})
	});
	
	rain_drops.forEach((raindrop,raindropIndex)=> {
		raindrop.update(dt)
		let toDelete = []
		if (
		//raindrop.x + raindrop.radius < 0 ||
		//raindrop.x - raindrop.radius > canvas.width ||
		raindrop.y < 0 ||
		raindrop.y - raindrop.radius > canvas.height)
		{
			toDelete.push(raindropIndex);
			/*setTimeout(() => {
					rain_drops.splice(raindropIndex,1)
			}, 0)*/
		}
		toDelete.forEach((del,raindropIndex2)=> {
			rain_drops.splice(del,1)
		})
	})
	
	
	if (now - lastDrop > 25)
	{
		lastDrop = now;
		if (rain_drops.length < 200)
		{
			spawnRaindrop(mousePos.x + getRandom(150), mousePos.y + getRandom(100), {x: 0.1 * (Math.random() ), y: 1.5});
		}
	}
	targetFactory()
	//raindropFactory();
}
class Raindrop {
	constructor(x,y,radius,color, velocity){
		this.x = x
		this.y = y
		this.radius = radius
		this.color = color
		this.velocity = velocity
	}
	draw(){
		c.beginPath()
		c.arc(this.x, this.y, 
			this.radius, 0, Math.PI * 2, false)
		c.fillStyle = this.color
		c.fill()
	}
	update(dt){
		this.draw()
		this.x = this.x + (this.velocity.x * dt)
		this.y = this.y + (this.velocity.y * dt)
	}
	
}
class MouseTarget {
	constructor(x,y,radius , time){
		this.x = x
		this.y = y
		this.radius = radius
		//this.color = color
		this.time = time
		this.maxTime = time;
	}
	draw(){
	
		/*
		c.beginPath()
		c.arc(this.x, this.y, 
			this.radius, 0, Math.PI * 2, false)
		c.fillStyle = 'black'
		c.fill()*/
		
		if (this.time >= 0)
		{
			c.beginPath()
			c.arc(this.x, this.y, 
				this.radius * (this.time / this.maxTime), 0, Math.PI * 2, false)
			c.fillStyle = 'gray'
			c.fill()
			
			
		}
		
		
	}
	update(dt){
		this.draw()
		this.time = this.time - dt;
	}
	
}
function spawnRaindrop(x, y, velocity)
{
	rain_drops.push(
		new Raindrop(x,
		y, 3,'gray',
		velocity)
		)
}
function spawnParticle(x, y, velocity)
{
	rain_drops.push(
		new Raindrop(x,
		y, 5,'white',
		velocity)
		)
}
function spawnTarget(x, y, radius, time)
{

	if (create_level_mode)
	{
		mouse_targets.push(
			new MouseTarget(x,
			y, radius,
			time)
		)
		level_targets[video.currentTime] = new MouseTarget(x, y, radius, time)
	}
	
}
let lastkeyIndex = -1;
var levelKeys = []; 
function targetFactory()
{


	for (let i = lastkeyIndex; i < levelKeys.length; i++)
	{
		if (i <= lastkeyIndex)
		{
			continue;
		}
		if (levelKeys[i] > video.currentTime)
		{
			continue;
		}

		lastkeyIndex = i;
		let t = level_targets[levelKeys[lastkeyIndex]];
		mouse_targets.push(new MouseTarget(t.x, t.y, t.radius, t.maxTime));
		console.log("Pushed new target");
	}
	/*
	for (let i = 0; i < 10; i++)
	{
		spawnRaindrop(Math.random() * 100 * i, 0, {x:Math.random() + 0.2, y: 0.5 + Math.random()});
	}*/
}
function begin(){
	video.play();
	animate();
	//music_ame.play();
}
function mouse_update(p){
	mousePos.x = p.pageX;
	mousePos.y = p.pageY;
}
addEventListener('mousemove', mouse_update, false);
level_targets = JSON.parse(`{"0":{"x":529,"y":349,"radius":50,"time":5000,"maxTime":5000},"0.853671":{"x":1019,"y":494,"radius":50,"time":5000,"maxTime":5000},"1.325639":{"x":282,"y":588,"radius":50,"time":5000,"maxTime":5000},"1.774088":{"x":837,"y":293,"radius":50,"time":5000,"maxTime":5000},"2.221806":{"x":1305,"y":385,"radius":50,"time":5000,"maxTime":5000},"2.733855":{"x":298,"y":212,"radius":50,"time":5000,"maxTime":5000},"3.237936":{"x":971,"y":226,"radius":50,"time":5000,"maxTime":5000},"3.630027":{"x":749,"y":453,"radius":50,"time":5000,"maxTime":5000},"4.005858":{"x":531,"y":521,"radius":50,"time":5000,"maxTime":5000},"4.414163":{"x":985,"y":607,"radius":50,"time":5000,"maxTime":5000},"5.014389":{"x":1285,"y":606,"radius":50,"time":5000,"maxTime":5000},"5.455898":{"x":967,"y":268,"radius":50,"time":5000,"maxTime":5000},"20.617001":{"x":461,"y":215,"radius":50,"time":5000,"maxTime":5000},"22.287901":{"x":810,"y":628,"radius":50,"time":5000,"maxTime":5000},"23.280111":{"x":409,"y":434,"radius":50,"time":5000,"maxTime":5000},"24.072287":{"x":935,"y":310,"radius":50,"time":5000,"maxTime":5000},"24.71225":{"x":752,"y":443,"radius":50,"time":5000,"maxTime":5000},"25.097208":{"x":636,"y":549,"radius":50,"time":5000,"maxTime":5000},"25.514182":{"x":625,"y":594,"radius":50,"time":5000,"maxTime":5000},"25.744501":{"x":591,"y":528,"radius":50,"time":5000,"maxTime":5000},"25.94518":{"x":560,"y":411,"radius":50,"time":5000,"maxTime":5000},"26.154146":{"x":932,"y":288,"radius":50,"time":5000,"maxTime":5000},"26.355479":{"x":870,"y":417,"radius":50,"time":5000,"maxTime":5000},"26.552474":{"x":679,"y":453,"radius":50,"time":5000,"maxTime":5000},"26.752933":{"x":719,"y":461,"radius":50,"time":5000,"maxTime":5000},"26.968759":{"x":1001,"y":467,"radius":50,"time":5000,"maxTime":5000},"27.184912":{"x":607,"y":557,"radius":50,"time":5000,"maxTime":5000},"27.418929":{"x":1468,"y":645,"radius":50,"time":5000,"maxTime":5000},"27.600937":{"x":1314,"y":634,"radius":50,"time":5000,"maxTime":5000},"27.800992":{"x":561,"y":620,"radius":50,"time":5000,"maxTime":5000},"28.02481":{"x":1353,"y":528,"radius":50,"time":5000,"maxTime":5000},"28.25312":{"x":488,"y":554,"radius":50,"time":5000,"maxTime":5000},"28.474679":{"x":1043,"y":559,"radius":50,"time":5000,"maxTime":5000},"28.690643":{"x":765,"y":570,"radius":50,"time":5000,"maxTime":5000},"28.928991":{"x":547,"y":546,"radius":50,"time":5000,"maxTime":5000},"29.149244":{"x":1074,"y":472,"radius":50,"time":5000,"maxTime":5000},"29.364265":{"x":833,"y":415,"radius":50,"time":5000,"maxTime":5000},"29.601218":{"x":981,"y":381,"radius":50,"time":5000,"maxTime":5000},"29.82514":{"x":762,"y":397,"radius":50,"time":5000,"maxTime":5000},"30.0733":{"x":1098,"y":407,"radius":50,"time":5000,"maxTime":5000},"30.281543":{"x":893,"y":431,"radius":50,"time":5000,"maxTime":5000},"30.517467":{"x":421,"y":462,"radius":50,"time":5000,"maxTime":5000},"30.788541":{"x":720,"y":505,"radius":50,"time":5000,"maxTime":5000},"31.018011":{"x":423,"y":668,"radius":50,"time":5000,"maxTime":5000},"31.260966":{"x":1018,"y":739,"radius":50,"time":5000,"maxTime":5000},"31.505181":{"x":447,"y":761,"radius":50,"time":5000,"maxTime":5000},"31.76163":{"x":1202,"y":747,"radius":50,"time":5000,"maxTime":5000},"32.033453":{"x":387,"y":755,"radius":50,"time":5000,"maxTime":5000},"32.29751":{"x":1194,"y":607,"radius":50,"time":5000,"maxTime":5000},"32.561553":{"x":475,"y":480,"radius":50,"time":5000,"maxTime":5000},"32.783352":{"x":1413,"y":416,"radius":50,"time":5000,"maxTime":5000},"32.997871":{"x":925,"y":460,"radius":50,"time":5000,"maxTime":5000},"33.260847":{"x":286,"y":441,"radius":50,"time":5000,"maxTime":5000},"33.505454":{"x":1258,"y":359,"radius":50,"time":5000,"maxTime":5000},"33.713411":{"x":1321,"y":634,"radius":50,"time":5000,"maxTime":5000},"33.956138":{"x":416,"y":555,"radius":50,"time":5000,"maxTime":5000},"34.1936":{"x":537,"y":316,"radius":50,"time":5000,"maxTime":5000},"34.770145":{"x":832,"y":313,"radius":50,"time":5000,"maxTime":5000},"35.209999":{"x":655,"y":521,"radius":50,"time":5000,"maxTime":5000},"35.622024":{"x":752,"y":632,"radius":50,"time":5000,"maxTime":5000},"36.005188":{"x":977,"y":675,"radius":50,"time":5000,"maxTime":5000},"36.414077":{"x":1163,"y":571,"radius":50,"time":5000,"maxTime":5000},"36.817911":{"x":1037,"y":312,"radius":50,"time":5000,"maxTime":5000},"37.221979":{"x":469,"y":385,"radius":50,"time":5000,"maxTime":5000},"37.623446":{"x":357,"y":605,"radius":50,"time":5000,"maxTime":5000},"38.033577":{"x":1142,"y":753,"radius":50,"time":5000,"maxTime":5000},"38.396555":{"x":1678,"y":653,"radius":50,"time":5000,"maxTime":5000},"38.812532":{"x":1317,"y":383,"radius":50,"time":5000,"maxTime":5000},"39.224336":{"x":606,"y":383,"radius":50,"time":5000,"maxTime":5000},"40.959462":{"x":842,"y":508,"radius":50,"time":5000,"maxTime":5000},"41.311372":{"x":633,"y":203,"radius":50,"time":5000,"maxTime":5000},"41.567431":{"x":1140,"y":385,"radius":50,"time":5000,"maxTime":5000},"41.843339":{"x":379,"y":535,"radius":50,"time":5000,"maxTime":5000},"42.112376":{"x":1617,"y":633,"radius":50,"time":5000,"maxTime":5000},"42.619427":{"x":884,"y":736,"radius":50,"time":5000,"maxTime":5000},"42.98708":{"x":268,"y":622,"radius":50,"time":5000,"maxTime":5000},"43.38608":{"x":1005,"y":169,"radius":50,"time":5000,"maxTime":5000},"43.819241":{"x":675,"y":635,"radius":50,"time":5000,"maxTime":5000},"44.224729":{"x":1410,"y":607,"radius":50,"time":5000,"maxTime":5000},"44.656038":{"x":806,"y":404,"radius":50,"time":5000,"maxTime":5000},"45.090542":{"x":1557,"y":546,"radius":50,"time":5000,"maxTime":5000},"45.493453":{"x":616,"y":616,"radius":50,"time":5000,"maxTime":5000},"45.920996":{"x":626,"y":447,"radius":50,"time":5000,"maxTime":5000},"46.317531":{"x":1144,"y":567,"radius":50,"time":5000,"maxTime":5000},"46.75555":{"x":813,"y":664,"radius":50,"time":5000,"maxTime":5000},"47.177063":{"x":814,"y":377,"radius":50,"time":5000,"maxTime":5000},"47.578361":{"x":1384,"y":557,"radius":50,"time":5000,"maxTime":5000},"47.980557":{"x":920,"y":733,"radius":50,"time":5000,"maxTime":5000},"48.418856":{"x":984,"y":707,"radius":50,"time":5000,"maxTime":5000},"48.918623":{"x":1062,"y":687,"radius":50,"time":5000,"maxTime":5000},"49.348743":{"x":1156,"y":661,"radius":50,"time":5000,"maxTime":5000},"49.711075":{"x":1318,"y":666,"radius":50,"time":5000,"maxTime":5000},"50.093413":{"x":1483,"y":654,"radius":50,"time":5000,"maxTime":5000},"50.511715":{"x":1612,"y":600,"radius":50,"time":5000,"maxTime":5000},"50.927559":{"x":1570,"y":488,"radius":50,"time":5000,"maxTime":5000},"51.348666":{"x":1426,"y":405,"radius":50,"time":5000,"maxTime":5000},"51.765178":{"x":1271,"y":355,"radius":50,"time":5000,"maxTime":5000},"52.198303":{"x":1026,"y":338,"radius":50,"time":5000,"maxTime":5000},"52.623482":{"x":853,"y":331,"radius":50,"time":5000,"maxTime":5000},"53.075249":{"x":739,"y":350,"radius":50,"time":5000,"maxTime":5000},"53.471559":{"x":727,"y":399,"radius":50,"time":5000,"maxTime":5000},"54.061965":{"x":729,"y":527,"radius":50,"time":5000,"maxTime":5000},"55.103473":{"x":1081,"y":465,"radius":50,"time":5000,"maxTime":5000},"55.369366":{"x":534,"y":197,"radius":50,"time":5000,"maxTime":5000},"55.617663":{"x":1084,"y":321,"radius":50,"time":5000,"maxTime":5000},"55.932258":{"x":1028,"y":381,"radius":50,"time":5000,"maxTime":5000},"56.165006":{"x":547,"y":428,"radius":50,"time":5000,"maxTime":5000},"56.542969":{"x":323,"y":396,"radius":50,"time":5000,"maxTime":5000},"56.788594":{"x":0,"y":379,"radius":50,"time":5000,"maxTime":5000},"57.04394":{"x":865,"y":302,"radius":50,"time":5000,"maxTime":5000},"57.295141":{"x":1355,"y":503,"radius":50,"time":5000,"maxTime":5000},"57.510928":{"x":1419,"y":572,"radius":50,"time":5000,"maxTime":5000},"57.786299":{"x":1460,"y":283,"radius":50,"time":5000,"maxTime":5000},"57.995045":{"x":918,"y":239,"radius":50,"time":5000,"maxTime":5000},"58.213464":{"x":516,"y":370,"radius":50,"time":5000,"maxTime":5000},"58.535175":{"x":1018,"y":656,"radius":50,"time":5000,"maxTime":5000},"58.735865":{"x":1356,"y":543,"radius":50,"time":5000,"maxTime":5000},"59.206165":{"x":359,"y":310,"radius":50,"time":5000,"maxTime":5000},"59.622952":{"x":1352,"y":426,"radius":50,"time":5000,"maxTime":5000},"60.005125":{"x":727,"y":470,"radius":50,"time":5000,"maxTime":5000},"60.433593":{"x":955,"y":299,"radius":50,"time":5000,"maxTime":5000},"60.823566":{"x":577,"y":306,"radius":50,"time":5000,"maxTime":5000},"61.219157":{"x":959,"y":600,"radius":50,"time":5000,"maxTime":5000},"61.648981":{"x":1243,"y":365,"radius":50,"time":5000,"maxTime":5000},"62.03444":{"x":779,"y":529,"radius":50,"time":5000,"maxTime":5000},"62.499318":{"x":1580,"y":374,"radius":50,"time":5000,"maxTime":5000},"62.970852":{"x":574,"y":344,"radius":50,"time":5000,"maxTime":5000},"64.59935":{"x":1049,"y":311,"radius":50,"time":5000,"maxTime":5000},"64.964667":{"x":593,"y":250,"radius":50,"time":5000,"maxTime":5000},"65.359657":{"x":1093,"y":270,"radius":50,"time":5000,"maxTime":5000},"65.777156":{"x":729,"y":384,"radius":50,"time":5000,"maxTime":5000},"66.181668":{"x":433,"y":495,"radius":50,"time":5000,"maxTime":5000},"66.609917":{"x":1014,"y":534,"radius":50,"time":5000,"maxTime":5000},"67.027882":{"x":918,"y":315,"radius":50,"time":5000,"maxTime":5000},"67.441626":{"x":489,"y":243,"radius":50,"time":5000,"maxTime":5000}}`);
levelKeys = Object.keys(level_targets);
console.log(level_targets);
window.addEventListener('click', 	(evt)=> {
	begin();
	spawnTarget(mousePos.x, mousePos.y, 50 , 5000);
})
window.addEventListener('contextmenu', function(ev) {
    ev.preventDefault();
	if (create_level_mode)
	{
		navigator.clipboard.writeText(JSON.stringify(level_targets));
	}
    return false;
}, false);


