app.controller('mainCtrl', function($scope, $rootScope, $location, $routeParams, $http, Api){
	
	// Variavel com todos os dados do usuario
	Api.getAdm().success(function(data,res){
		$rootScope.user = data;
		
		// Se usuario for convidado
		// Manda para tela de perfil para ser cadastrado informações minimas
		if(!data.nome) $rootScope.go('sua-conta');
	});

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews = function(status) {
		$('#load-modal').modal(status?'show':'hide');
	}

	// Navega entre as pages depois do appname
	$scope.goInternalPages = function(destino) {
		// Exibir load
		$rootScope.loadViews(true);
		$location.path('/' + $routeParams.app_id + destino);
	}

	$rootScope.go = function(destino) {
		// Exibir load
		$rootScope.loadViews(true);
		$location.path(destino);
	}

	// Define qual item do meu o suario esta
	// SOmente para urls depois do nome do aplicativo
	$scope.isActive = function (path) {
		return ($location.path().split('/')[2] === path) ? 'active' : '';
	}

	// Retornar para view somente o primeiro nome
	$scope.firstName = function() {
		if($rootScope.user) {
			if($rootScope.user.nome)
				return $rootScope.user.nome.split(' ')[0];
			else
				return $rootScope.user.local.email.split('@')[0];
		}
	}
});