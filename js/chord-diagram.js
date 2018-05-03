//immport data and use function to convert to an R tree
var rt = cw(function(data,cb){
	var self = this;
	var request,_resp;
	importScripts("js/rtree.js");
	if(!self.rt){
		self.rt=RTree();
		request = new XMLHttpRequest();
		request.open("GET", data);
		request.onreadystatechange = function() {
			if (request.readyState === 4 && request.status === 200) {
				_resp=JSON.parse(request.responseText);
				self.rt.geoJSON(_resp);
				cb(true);
			}
		};
		request.send();
	}else{
		return self.rt.bbox(data);
	}
});

rt.data(cw.makeUrl("js/trips.json"));



rt.data().then(
    function(d){
        var result = d.map(function(a) {return a.properties;})
        console.log(result);		// Trip Info: avspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames, taxiid, tripid
        console.log("Hello?")
    }
);


//construct chord diagram
var matrix = d3.range(6).map(function(row) {
    return d3.range(6).map(function(col) {
        return Math.pow(Math.random(),1.5);
    });
  });
  
  var width = 960,
      height = 500,
      innerRadius = Math.min(width, height) * 0.4,
      outerRadius = innerRadius + 40;
  
  var fill = d3.scale.ordinal()
    .range(colorbrewer.Spectral[6]);
  
  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  
  var chord = d3.layout.chord()
      .padding(0.05)
      .sortSubgroups(d3.descending)
      .matrix(matrix);
  
  svg.selectAll("path")
      .data(chord.groups)
    .enter().append("path")
      .style("fill", function(d) { return fill(d.index); })
      .style("stroke", "black") 
      .style("opacity",0.5)
      .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
      .attr("class","arc")
      .attr("id",function(d,i){return "group"+i;});
  
  svg.selectAll("text")
      .data(chord.groups)
    .enter().append("text")
      .attr("dx", 4)
      .attr("dy", 35)
    .append("textPath")
      .attr("class", "label")
      .attr("xlink:href", function(d) { return "#group" + d.index; })
      .text(function(d) { return "Arc " + d.index; })
      .style("fill", function(d) { return d3.rgb(fill(d.index)).darker(2); });
  
  svg.append("g")
      .attr("class", "chord")
    .selectAll("path")
      .data(chord.chords)
    .enter().append("path")
      .attr("d", d3.svg.chord().radius(innerRadius))
      .style("fill", function(d) {
        var chordcolor = d3.scale.linear()
          .range([fill(d.target.index), fill(d.source.index)])
          .domain([-1,1])
          .interpolate(d3.interpolateLab);
        var weight = (d.source.value - d.target.value) / (d.source.value + d.target.value);
        return chordcolor(weight);
      })
      .style("stroke","black")
      .style("opacity", 0.2);
  
d3.select(self.frameElement).style("height", height + "px");