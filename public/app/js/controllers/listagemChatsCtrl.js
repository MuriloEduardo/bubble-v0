app.controller('listagemChatsCtrl', function($scope, $rootScope, $location){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	$scope.openChat = function(app){
		// Exibir load
		$rootScope.loadViews(true);
		$rootScope.bubble = app;
		$location.path('/' + app._id.toLowerCase());
	};
});