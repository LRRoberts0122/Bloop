// ****************************************************** //
// ****************************************************** //
//     			Bloop - 2014 Lindsay Roberts	 	      //
// ****************************************************** //
// ****************************************************** //	
(function() {
	var bloop = angular.module('bloop', ['ngRoute', 'firebase', 'angularUtils.directives.dirPagination', 'xeditable']);
	
	bloop.config(["$routeProvider", function($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'views/home.html',
				controller: 'HomeCtrl'
			})
			.when('/login', {
				templateUrl: 'views/login.html',
				controller: 'LoginCtrl'
			})
			.when('/dashboard', {
				templateUrl: 'views/tickets.html',
				controller: 'DashboardCtrl'
			})
			.when('/dashboard/ticket/:fbid', {
				templateUrl: 'views/ticket.html',
				controller: 'TicketCtrl'
			})
			.when('/myaccount', {
				templateUrl: 'views/account.html',
				controller: 'AccountCtrl'
			})
			.when('/admin', {
				templateUrl: 'views/admin.html',
				controller: 'AdminCtrl'
			})
			;
	}]);
	
	bloop.run(['$rootScope', '$firebase', '$firebaseSimpleLogin', function($rootScope, $firebase, $firebaseSimpleLogin) {
		$rootScope.url = "https://dbf-bloop.firebaseio.com/";
		$rootScope.dataRef = new Firebase($rootScope.url);
		$rootScope.loginObj = $firebaseSimpleLogin($rootScope.dataRef);
		
		/*  *************************************************
		 *  FUNCTION : $rootScope.giveXP(id, value)
		 *  - Gives the user experience points.
		 *  ************************************************* */		
		$rootScope.giveXP = function(opID, xpValue) {
			ref = new Firebase($rootScope.url + 'users/' + opID);
			obj = $firebase(ref).$asObject();
			
			obj.$loaded().then(function(data) {				
				obj.experience += xpValue;
				
				if(obj.experience >= 1000) {
					obj.experience = obj.experience - 1000;
					obj.level ++;
				}
				
				obj.$save();
				console.log("GAVE XP!");
			});
		}
	}]);
	
	/*  *************************************************
	 *  FILTER : 'reverse'
	 *  - Reverses the order of results.
	 *  ************************************************* */
	bloop.filter('reverse', function() {
		return function(items) {
			return items.slice().reverse();
		};
	});
	
	/*  *************************************************
	 *  DIRECTIVE : ng-enter
	 *  - Chat box "enter" functionality.
	 *  ************************************************* */
	bloop.directive('ngEnter', function () {
	    return function (scope, element, attrs) {
	        element.bind("keydown keypress", function (event) {
	            if(event.which === 13) {
	                scope.$apply(function (){
	                    scope.$eval(attrs.ngEnter);
	                });
					
	                event.preventDefault();
	            }
	        });
	    };
	});
		
	/*  *************************************************
	 *  CONTROLLER : Home Page
	 *  ************************************************* */
	bloop.controller('HomeCtrl', ['$rootScope', '$scope', '$firebase', function($rootScope, $scope, $firebase) {		
		console.log("HomeController!");
		
		var url = 'https://dbf-bloop.firebaseio.com/tickets/';
		var ref = new Firebase(url);
		var currentChat = null;
		
		// $SCOPE.CREATETICKET
		// - This function makes a connection to Firebase and creates the ticket.
		$scope.createTicket = function() {
			$scope.tickets = $firebase(ref).$asArray();
			$scope.tickets.$add($scope.ticketObject).then(function(r) {
				var id = r.name();
				$scope.ticketObject.fbid = id;
				$scope.currentFBID = id;
				
				$scope.syncTickets();
				
				
				console.log("===========================");
				console.log("CREATED TICKET: " + $scope.currentFBID);
				console.log("URL: " + url + $scope.currentFBID);
				console.log("===========================");
			});
		}
		
		// $SCOPE.SYNCTICKETS
		// - This function makes a connection to Firebase and syncs the ticket with the $scope to easily update the tickets.
		$scope.syncTickets = function() {
			
			/* CURRENT CHAT */
			var ticketRefURL = new Firebase(url + $scope.currentFBID);
			currentChat = $firebase(ticketRefURL);
			$scope.currentChat = currentChat.$asObject();
			currentChat.$set($scope.ticketObject);
			
			/* CURRENT ARCHIVE */
			var archiveRefURL = new Firebase(url + $scope.currentFBID + "/archive");
			$scope.currentArchive = $firebase(archiveRefURL).$asArray();
			
			console.log("===========================");
			console.log("SAVED TICKET: " + $scope.currentFBID);
			console.log("URL: " + ticketRefURL);
			console.log("ARCHIVE URL: " + archiveRefURL);
			console.log("===========================");
		}
		
		
		// $SCOPE.POST
		// - This function pushes whatever is typed into the chat into the chat archive.
		// - $scope.ticketObject.archive (is an array of objects)
		$scope.post = function(name) {
			
			/* PUSH CHAT TO ARCHIVE */
			if($scope.chatText != "") {
				$scope.currentArchive.$add({
					"name" : name,
					"text" : $scope.chatText,
					"class" : "guestMessage"
				}).then(function() {
					/* MANAGE SCROLL TO BOTTOM */
					if($scope.toggleState === true) {
						var out = document.querySelector(".chatText");			
						var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
						if(!isScrolledToBottom) { 
							out.scrollTop = out.scrollHeight - out.clientHeight; 
						}
					}
				});
				
				/* EMPTY TEXTAREA */
				$scope.chatText = "";
			}
		}
		
		// $SCOPE.CLOSE
		// - Closes the current ticket.
		$rootScope.close = function() {
			console.log("CHATBOX WAS CLOSED!");
			
			/* DESTROY EMPTY CHAT, OR SAVE */
			if($scope.currentArchive.length === 0) {
				console.log("DESTROYING CHAT!");
				currentChat.$remove();
			} else {
				if($scope.currentChat.opID != "Unassigned") {
					$rootScope.giveXP($scope.currentChat.opID, 130);
				}
				
				$scope.currentChat.status = "CLOSED";				
				$scope.currentChat.$save();
			}
			
			/* RESET TICKET */
			$scope.ticketObject = {};
			$scope.ticketExists = false;
		}
		
		// $SCOPE.TOGGLE
		// - This function toggles the chat to be either open or closed.
		$scope.toggle = function() {
			if($scope.toggleState === false) {
				$scope.toggleState = true;
			} else if($scope.toggleState === true) {
				$scope.toggleState = false;
			}
		}
		
		// $SCOPE.CHECKTICKET
		// - This function checks to see if there's an existing ticket.
		// - If there's not an existing ticket, it creates one.
		$scope.checkTicket = function() {
			console.log("TICKET EXISTS? ", $scope.ticketExists);
			if($scope.ticketExists === false && $scope.toggleState === false) {
				
				/* GENERATE TICKET DATA */
				$scope.ticketObject = newTicket();
				
				/* CREATE TICKET */
				$scope.createTicket();
				$scope.ticketExists = true;
			}
		}
		
		// NEWTICKET()
		// - This function returns a ticket JSON object to be saved into Firebase.
		function newTicket() {
			var ticketID = generateTicketID();
				
			var newTicket = {
				fbid: "",
				id: ticketID,
				status: "OPEN",
				name: "N/A",
				email: "N/A",
				date: generateDate(),
				opID: "Unassigned",
				opName: "Unassigned",
				archive: [],
				notes: []
			}
						
			return newTicket;
		}
		
		// GENERATETICKETID()
		// - This function generates a (probably) unique ID for the ticket.
		function generateTicketID() {
			var chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
			var result = '';
			for(var i=12; i>0; --i) {
				result += chars[Math.round(Math.random() * (chars.length - 1))];
			}
			return result;
		}
		
		// GENERATEDATE()
		// - This function creates a new date.
		function generateDate() {
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth() + 1;
			var yyyy = today.getFullYear();
			
			if(dd < 10) {
				dd = '0' + dd;
			}
			
			if(mm < 10) {
				dd = '0' + mm;
			}
			
			var date = mm + "/" + dd + "/" + yyyy;
			return date;
		}
	}]);
	
	/*  *************************************************
	 *  CONTROLLER : Login Page
	 *  ************************************************* */
	bloop.controller('LoginCtrl', ['$rootScope', '$scope', '$firebase', '$firebaseSimpleLogin', '$location', function($rootScope, $scope, $firebase, $firebaseSimpleLogin, $location) {
		console.log("LoginController!");		
		
		/* LOGIN FUNCTIONALITY */
		$scope.login = function() {			
			$rootScope.loginObj.$login("password", {
				email: $scope.email,
				password: $scope.password
			}).then(function(user) {
				console.log("Logged in as: ", user.uid);
				$location.path('/dashboard');
			}, function(error) {
				$scope.error = error;
				console.log("Error message:", $scope.error.message);
				console.log("Login failed: ", error);
			});
		}
		
		/* ERROR HANDLING */
		$scope.hideAlert = function(type) {
			if(type == 'error') {
				$scope.error = false;
			}
		}
	}]);
	
	/*  *************************************************
	 *  CONTROLLER : Dashboard
	 *  ************************************************* */
	bloop.controller('DashboardCtrl', ['$rootScope', '$scope', '$firebase', '$firebaseSimpleLogin', '$location', function($rootScope, $scope, $firebase, $firebaseSimpleLogin, $location) {
		console.log("DashboardController!");
		
		var ticketsRef = new Firebase('https://dbf-bloop.firebaseio.com/tickets');
		$scope.tickets = $firebase(ticketsRef).$asArray();
		
		/* VERIFY USER IS LOGGED IN */		
		$rootScope.loginObj.$getCurrentUser().then(function(userObj) {
			if(userObj === null) {
				$location.path('/login');
			} else {
				var userRef = new Firebase('https://dbf-bloop.firebaseio.com/users/' + userObj.id);
				userRef.on("value", function(snap) {
					console.log(snap.val());
					var op = snap.val();
					$scope.theUser = op;			
				});
			}
		});		
	}]);
	
	/*  *************************************************
	 *  CONTROLLER : View Ticket (Detailed)
	 *  ************************************************* */
	bloop.controller('TicketCtrl', ["$rootScope", "$scope", "$firebase", "$routeParams", "$location", function($rootScope, $scope, $firebase, $routeParams, $location) {
	
			var ticketRef = new Firebase('https://dbf-bloop.firebaseio.com/tickets/' + $routeParams.fbid);
			$scope.ticket = $firebase(ticketRef).$asObject();
			
			var archiveRefURL = new Firebase('https://dbf-bloop.firebaseio.com/tickets/' + $routeParams.fbid + "/archive");
			currentArchive = $firebase(archiveRefURL);
			$scope.currentArchive = currentArchive.$asArray();
			
			var opID = null;
			
			/* VERIFY USER IS LOGGED IN */
			$rootScope.loginObj.$getCurrentUser().then(function(userObj) {
				if(userObj === null) {
					$location.path('/login');
				} else {
					$scope.ticket.$loaded().then(function() {
						/* IF THE TICKET IS DESTROYED, RETURN USER TO DASHBOARD */
						$scope.ticket.$watch(function () {
							if($scope.ticket.$value === null) {
								$location.path('/dashboard');
							}
						});
						
						var userRef = new Firebase('https://dbf-bloop.firebaseio.com/users/' + userObj.id);
						$scope.op = $firebase(userRef).$asObject();
						
						$scope.op.$loaded().then(function() {
							opID = $scope.op.id;
							
							/* ASSIGN OPERATOR IF TICKET IS OPEN */
							if($scope.ticket.status === "OPEN") {
								$scope.ticket.opName = $scope.op.firstname;
								$scope.ticket.opID = $scope.op.id;
								$scope.ticket.status = "TAKEN";
								$scope.ticket.$save();
								
								$rootScope.giveXP($scope.op.id, 10);
								
								console.log("TICKET UPDATED!");
							}
						})
										
					});					
				}
			});
			
			/* X-EDITABLE */
			/* FUNCTIONALITY FOR CHANGING STATUS */		
			$scope.statuses = [
				{value: 'OPEN', text: 'OPEN'},
				{value: 'TAKEN', text: 'TAKEN'},
				{value: 'CLOSED', text: 'CLOSED'},
			];
			
			// $SCOPE.SHOWSTATUS()
			// - This function updates the currently selected status.
			$scope.showStatus = function() {
				var selected = ($scope.statuses, {value: $scope.ticket.status});
				console.log("TICKET STATUS: " + $scope.ticket.status);
				return ($scope.user.status && selected.length) ? selected[0].text : 'Not set';
			};
			
			// $SCOPE.SAVEDATA(data, type)
			// - This function saves any edited account information.
			$scope.saveData = function(data, type) {
				if(type === "ticket.name") {
					$scope.ticket.name = data;
				} else if (type === "ticket.email") {
					$scope.ticket.email = data;
				} else if (type === "ticket.notes") {
					$scope.ticket.notes = data;
				} else if (type === "ticket.status") {
					$scope.ticket.status = data;
				}
				
				/* GIVES THE USER 5XP FOR EDITING ACCOUNT INFO */
				$rootScope.giveXP(opID, 5);
				$scope.ticket.$save();
			};
			
			
			// $SCOPE.POST
			// - This function pushes whatever is typed into the chat into the chat archive.
			// - $scope.ticketObject.archive (is an array of objects)
			$scope.post = function(name) {
				
				/* MANAGES SCROLL FUNCTIONALITY */
				var out = document.querySelector("#messageArchive");					
				var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
				if(!isScrolledToBottom) { 
					out.scrollTop = out.scrollHeight - out.clientHeight;
				}
				
				if($scope.repChatText != "") {
					$scope.currentArchive.$add({
					"name" : name,
					"text" : $scope.repChatText,
					"class" : "repMessage"
					});
				}
				
				/* RESET CHAT TEXT */
				$scope.repChatText = "";
			}
		}
	]);
	
	/*  *************************************************
	 *  CONTROLLER : My Account
	 *  ************************************************* */
	bloop.controller('AccountCtrl', ['$rootScope', '$scope', '$firebase', '$location', function($rootScope, $scope, $firebase, $location) {
		console.log("AccountController!");
		
		var currentUser = null;
		$scope.percent = 0;
		
		/* VERIFY USER IS LOGGED IN */
		$rootScope.loginObj.$getCurrentUser().then(function(userObj) {
			if(userObj === null) {
				$location.path('/login');
			} else {
				displayAccountInfo(userObj.id);
				currentUser = userObj;
				
				var userRef = new Firebase('https://dbf-bloop.firebaseio.com/users/' + userObj.id);	
				$scope.theUser = $firebase(userRef).$asObject();
				
				$scope.theUser.$loaded().then(function() {
					$scope.percent = ($scope.theUser.experience * 100) / 1000;
				});
			}
		});
		
		// $SCOPE.RESETPASSWORD()
		// - This function resets the current user's password.
		$scope.resetPassword = function() {
			$rootScope.loginObj.$changePassword(currentUser.email, $scope.currentPass, $scope.newPass).then(function() {
				console.log("Success!");
				$scope.error = false;
				$scope.success = true;
			}, function(error) {
				console.log("ERROR:", error);
				$scope.success = false;
				$scope.error = error; //turns error to true
			});
		}
		
		// $SCOPE.HIDEALERT()
		// - This function hides error / success alerts.
		$scope.hideAlert = function(type) {
			if(type == 'error') {
				$scope.error = false;
			}
			
			if(type == 'success') {
				$scope.success = false;
			}
		}
		
		// DISPLAYACCOUNTINFO()
		// - This function sets a scope to show the current user's account information.
		function displayAccountInfo(id) {
			var userRef = new Firebase($rootScope.url + 'users/' + id);
			$scope.currentUser = $firebase(userRef).$asObject();
		}
	}]);
	
	/*  *************************************************
	 *  CONTROLLER : Administration
	 *  ************************************************* */
	bloop.controller('AdminCtrl', ['$rootScope', '$scope', '$firebase', '$location', function($rootScope, $scope, $firebase, $location) {
		console.log("AdminController!");
		
		var usersURL = 'https://dbf-bloop.firebaseio.com/users/';
		
		/* VERIFY USER IS LOGGED IN */
		$rootScope.loginObj.$getCurrentUser().then(function(userObj) {
			if(userObj === null) {
				$location.path('/login');
			} else {
				var userRef = new Firebase(usersURL + userObj.id);	
				
				userRef.on("value", function(snap) {
					var op = snap.val();
					if(op.type != 'Admin') {
						$location.path('/dashboard');
					}						
				});
			}
		});
		
		// $SCOPE.CREATEUSER(success)
		// - This function creates a new account.	
		$scope.createUser = function(success) {
			console.log($scope.input.usertype);
			var usertype = $scope.input.usertype;
			var firstname = $scope.input.firstname;
			var lastname = $scope.input.lastname;
				
			$rootScope.loginObj.$createUser($scope.input.email, "bloop").then(function(user) {
				var ref = new Firebase(usersURL + user.id);
				var userRef = $firebase(ref);
				$scope.user = userRef.$asObject();
				
				userRef.$set({
					id : user.id,
					type : usertype,
					firstname : firstname,
					lastname : lastname,
					email : user.email,
					level : 1,
					experience : 0,
					ratings: [],
					tickets: []
				});
				$scope.success = true;
				$scope.error = false;
			}, function(error) {
				$scope.success = false;
				$scope.error = error;
				console.log("Create user failed: ", error);
			});
			
			$scope.hideAlert = function(type) {
				if(type == 'error') {
					$scope.error = false;
				}
				
				if(type == 'success') {
					$scope.success = false;
				}
			}
						
			$scope.input.firstname = "";
			$scope.input.lastname = "";
			$scope.input.username = "";
			$scope.input.email = "";
			$scope.input.usertype = "";
		}				
	}]);
})();