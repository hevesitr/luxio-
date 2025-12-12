/**
 * NavigationService - Globális navigációs szolgáltatás
 * Központosított navigáció kezelése különböző képernyők között
 */
import { CommonActions, StackActions } from '@react-navigation/native';

class NavigationService {
  constructor() {
    this.navigator = null;
    this.isReady = false;
  }

  setTopLevelNavigator(navigatorRef) {
    this.navigator = navigatorRef;
    this.isReady = true;
  }

  navigate(routeName, params = {}) {
    if (!this.isReady || !this.navigator) {
      console.warn('NavigationService: Navigator not ready');
      return;
    }

    this.navigator.dispatch(
      CommonActions.navigate({
        name: routeName,
        params,
      })
    );
  }

  // Discovery Stack navigáció
  goToProfileDetail(profile) {
    this.navigate('ProfileDetail', { profile });
  }

  goToSearch() {
    this.navigate('Search');
  }

  goToTopPicks() {
    this.navigate('TopPicks');
  }

  goToPassport() {
    this.navigate('Passport');
  }

  // Matches Stack navigáció
  goToChat(match) {
    this.navigate('Chat', { match });
  }

  goToLikesYou() {
    this.navigate('LikesYou');
  }

  // Profile Stack navigáció
  goToSettings() {
    this.navigate('Settings');
  }

  goToPremium() {
    this.navigate('Premium');
  }

  goToBoost() {
    // Temporarily show alert until Boost screen is properly implemented
    alert('Boost funkció hamarosan elérhető!');
  }

  goToVerification() {
    this.navigate('Verification');
  }

  goToEditProfile() {
    this.navigate('EditProfile');
  }

  // Általános navigációs metódusok
  goBack() {
    if (!this.isReady || !this.navigator) {
      console.warn('NavigationService: Navigator not ready');
      return;
    }

    this.navigator.dispatch(CommonActions.goBack());
  }

  resetToScreen(routeName, params = {}) {
    if (!this.isReady || !this.navigator) {
      console.warn('NavigationService: Navigator not ready');
      return;
    }

    this.navigator.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      })
    );
  }

  // Tab váltás
  switchToTab(tabName) {
    // Bottom tab navigator esetében ez a fő képernyők közötti váltás
    this.navigate(tabName);
  }

  // Deep linking és URL handling
  handleDeepLink(url) {
    // TODO: Implement deep link handling
    console.log('Deep link received:', url);
  }
}

const navigationService = new NavigationService();
export default navigationService;
