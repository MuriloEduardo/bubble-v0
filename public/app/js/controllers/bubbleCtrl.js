app.controller('bubbleCtrl', function($scope, $rootScope, $timeout, $filter, $window){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = true;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	console.log('$rootScope')
	console.log($rootScope)
	var socket = io.connect('http://127.0.0.1:4000/'),
		bubble = $rootScope.bubble,
		Usuario = $rootScope.user;
		
		console.log('Usuario')
		console.log(Usuario)

	$scope.conversa  = {};
	$scope.conversas = [];
	$scope.equipe    = [];

	$scope.administrador = {
		canal_atual: Usuario._id,
		bubble_id: bubble._id,
		socket_id: Usuario._id
	}

	console.info(Usuario.nome)

	if(bubble.conversas.length) {
		for (var i = 0; i < bubble.conversas.length; i++) {
			if(bubble.conversas[i].mensagens&&bubble.conversas[i].mensagens.length) {
				bubble.conversas[i].canal_atual = bubble._id;
				bubble.conversas[i].bubble_id = $scope.administrador.bubble_id;
				$scope.conversas.push(bubble.conversas[i]);
			}
		}
	}

	if(Usuario.conversas.length) {
		for (var i = 0; i < Usuario.conversas.length; i++) {
			if(Usuario.conversas[i].mensagens&&Usuario.conversas[i].mensagens.length) {
				Usuario.conversas[i].canal_atual = Usuario._id;
				Usuario.conversas[i].bubble_id = $scope.administrador.bubble_id;
				$scope.conversas.push(Usuario.conversas[i]);
			}
		}
	}

	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};

	$timeout(function(){
		$scope.$broadcast('rebuild:conversas');
	});

	var scrollBottom = function() {
		$scope.safeApply(function() {
			$scope.$broadcast('rebuild:messages');
			$scope.$broadcast('rebuild:conversas');
	    });
	}

	$scope.dadosCliente = function() {
    	if(!$scope.dadosClienteToggle) {
    		$scope.dadosClienteToggle = true;
    	} else {
    		$scope.dadosClienteToggle = false;
    	}
    }

    $scope.ultimaMsg = function(data) {
    	return data.mensagens[data.mensagens.length-1];
    }

    var checkFocus = function() {
    	return document.hasFocus();
    }

    $scope.naoVisualizadas = function(cliente) {
    	var m = $filter('filter')($scope.conversas, {socket_id: cliente.socket_id, canal_atual:cliente.canal_atual}, true)[0];
    	var t = m.mensagens.filter(function(i) {return !i.visulizada&&!i.remetente;});
    	return t.length;
    }

    var displayVisualiza = function() {
    	var m = $filter('filter')($scope.conversas, {socket_id: $scope.administrador.cliente_socket_id, canal_atual: $scope.administrador.canal_atual}, true)[0];
		if(m) {
			for (var i = 0; i < m.mensagens.length; i++) {
				if(!m.mensagens[i].remetente) {
					$scope.safeApply(function() {
						m.mensagens[i].visulizada = true;
			        });
				}
			}
		}
    }

	socket.on('connect', function() {

		socket.on('conversas', function(data) {
			for (var i=0;i<data.length;i++) {
				if(data[i]._id!=$scope.administrador.bubble_id&&data[i]._id!=$scope.administrador.socket_id) {
					$scope.safeApply(function() {
						$scope.equipe.push(data[i]);
					});
				}
			}
		});

		// Real Time Notify
		socket.emit('novo usuario', $scope.administrador);

		socket.on('usuarios', function(data) {
			for (var i = 0; i < data.length; i++) {
				var y = $filter('filter')($scope.equipe, {_id: data[i].canal_atual}, true)[0];
				$scope.safeApply(function() {
					if(y) y.connected = data[i].connected;
					console.log(data[i])
				});

				var u = $filter('filter')($scope.conversas, {socket_id: data[i].socket_id}, true)[0];
				$scope.safeApply(function() {
					if(u) u.connected = data[i].connected;
		        });
			}
		});

		$window.onfocus = function(){
			if($scope.administrador.cliente_socket_id && $scope.administrador.cliente_socket_id==$scope.conversa.socket_id && $scope.conversa.canal_atual == $scope.administrador.canal_atual) {
				$timeout(function(){
					visualizar();
					scrollBottom();
					displayVisualiza();
				});
			}
		}

		$scope.enviaMsg = function(mensagem) {
			
			var send_mensagem = {
				mensagem: mensagem,
				remetente: true,
				visulizada: false,
				data: new Date()
			}

			$scope.administrador.cliente_socket_id = $scope.conversa.socket_id;
			$scope.administrador.mensagem = send_mensagem;

			socket.emit('sent:mensagem', $scope.administrador);

			// Deixa o text area em branco novamente
			$scope.message = undefined;
		}

		socket.on('change:particular', function(data) {
			if($scope.administrador.socket_id != data.administrador.socket_id) {
				var m = $filter('filter')($scope.conversas, {socket_id: data.cliente.socket_id, canal_atual: data.cliente.bubble_id}, true)[0];
				var index = $scope.conversas.indexOf(m);
				$scope.safeApply(function() {
					if(index>=0) $scope.conversas.splice(index,1);
		        });
			}
		});

		$scope.trocarCliente = function(cliente) {
			var m = $filter('filter')($scope.conversas, {socket_id: cliente.socket_id}, true);

			if(m.length>1) {
				var cliente_bubble = $filter('filter')(m, {socket_id: cliente.socket_id, canal_atual: $scope.administrador.bubble_id}, true)[0];
				var cliente_particular = $filter('filter')(m, {socket_id: cliente.socket_id, canal_atual: $scope.administrador.socket_id}, true)[0];
				for (var i = 0; i < cliente_bubble.mensagens.length; i++) {
					cliente_particular.mensagens.push(cliente_bubble.mensagens[i]);
				}

				cliente = {
					bubble_id: cliente_particular.bubble_id,
					digitando: cliente_particular.digitando,
					mensagens: cliente_particular.mensagens,
					socket_id: cliente_particular.socket_id,
					canal_atual: cliente_particular.bubble_id
				};
				var index = $scope.conversas.indexOf(cliente_bubble);
				if(index>=0) $scope.conversas.splice(index,1);
			}
			if(cliente.canal_atual == cliente.bubble_id) {
				socket.emit('change:particular', {cliente:cliente,administrador:$scope.administrador});
				cliente.canal_atual = $scope.administrador.socket_id;
			}
			$scope.safeApply(function() {
				$scope.textareaBody = true;
				$scope.conversa = cliente;
				$scope.administrador.cliente_socket_id = cliente.socket_id;
			});
			$timeout(function(){
				visualizar();
				scrollBottom();
				displayVisualiza();
			});
		}

		var visualizar = function() {
			socket.emit('visualizar', {usuario:$scope.administrador,conversa:$scope.conversa});
		}

		socket.on('nova mensagem', function(data) {

			var _id = data.cliente_socket_id ? data.cliente_socket_id : data.socket_id;
			var m = $filter('filter')($scope.conversas, {socket_id: _id, canal_atual: data.canal_atual}, true)[0];

			if(data.canal_atual==$scope.administrador.bubble_id||data.canal_atual==$scope.administrador.socket_id) {
				if(m) {
					$scope.safeApply(function() {
						// Conversa ja existia no banco
						// So continuar dando push
						m.mensagens.push(data.mensagem);
					});
				} else {
					$scope.safeApply(function() {
						// Nova conversa
						$scope.conversas.push({
							bubble_id: data.bubble_id,
							canal_atual: data.canal_atual,
							socket_id: data.socket_id,
							mensagens: [data.mensagem]
						});
					});
				}
			} else {
				// Conversas da equipe
				var m = $filter('filter')($scope.equipe, {_id: data.canal_atual}, true)[0];
				var x = $filter('filter')(m.conversas, {socket_id: _id}, true)[0];
				// Dar push nas mensagens da equipe

			}
			scrollBottom();
		});

		$scope.typing = function() {
			$scope.administrador.digitando = $scope.message ? true : false;
		}

		$scope.$watch('administrador.digitando', function() {
			socket.emit('digitando', $scope.administrador);
		});

		socket.on('trocou canal', function(canal) {
			$scope.safeApply(function() {
				$scope.administrador.canal_atual = canal;
	        });
		});

		socket.on('digitando', function(data) {
			var m = $filter('filter')($scope.conversas, {socket_id: data.socket_id,canal_atual:data.canal_atual}, true)[0];
			if(m) {
				$scope.safeApply(function() {
					m.digitando = data.digitando;
				});
			}

			var e = $filter('filter')($scope.equipe, {_id: data.canal_atual}, true)[0];
			if(e) {
				$scope.safeApply(function() {
					e.client_digitando = data.digitando;
				});
			}
		});

		socket.on('visualizou', function(data) {
			if($scope.administrador.cliente_socket_id) {
				if($scope.administrador.cliente_socket_id==$scope.conversa.socket_id) {
					for (var i = 0; i < $scope.conversa.mensagens.length; i++) {
						if($scope.conversa.mensagens[i].remetente) {
							$scope.safeApply(function() {
								$scope.conversa.mensagens[i].visulizada = true;
					        });
						}
					}
				} else {
					displayVisualiza();
				}
			}
		});

		$scope.$on('$destroy', function (event) {
	        socket.removeAllListeners();
	    });
	});
});