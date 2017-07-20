import '../../imports/templates/templates.html';

//////////////////////////
// Router
//////////////////////////
 
export var Router = {
    uri: _.compact(window.location.pathname.split("/")),
    routes: [],
     
    addRoute: function(route, template) {
	    var segments =  _.compact(route.split("/"));
	     
	    var placeholders = _.reduce(segments, function(currentArr, piece, index) {
	        if (piece.substr(0, 1) === ":") {
	            currentArr.push(index);
	            segments[index] = piece.substr(1);
	        }
	        return currentArr;
	    }, []);
	     
	    this.routes.push({
	        segments: segments,
	        template: template,
	        placeholderIndexes: placeholders
	    });
	},
    getMatchingRoute: function(){
		for (var i in this.routes) {
			var route = this.routes[i];
			var data = {};

			if (route.segments.length === this.uri.length) {
			    var match = _.every(route.segments, function(seg, i) {
			        if (_.contains(route.placeholderIndexes, i)) {
			            data[seg] = this.uri[i];
			            return true;
			        } else {
			            return seg === this.uri[i];
			        }
			    }, this);

			    if (match) {
			        return {
			            data: data,
			            template: route.template
			        }
			    }
			}
		}
		//no matches (add 404 or default template maybe?)
		return false;
	},
    run: function(){
	    var route = this.getMatchingRoute();
	    var parentContainer = $('#main-wrapper')[0];
	    if (route) {
	    	Blaze.render(Template[route.template], parentContainer);
	    } else {
	        Blaze.render(Template['404'], parentContainer);
	    }
	}
};