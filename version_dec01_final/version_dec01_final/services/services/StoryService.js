// Story Service - 24 órás történetek kezelése
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@stories';

class StoryService {
  // Story létrehozása
  static async createStory(userId, storyData) {
    try {
      const stories = await this.getAllStories();
      const now = new Date();
      
      const newStory = {
        id: Date.now(),
        userId,
        image: storyData.image,
        text: storyData.text || null,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        views: [],
        reactions: [],
      };

      // Találd meg vagy hozd létre a felhasználó story gyűjteményét
      const userStoryIndex = stories.findIndex(s => s.userId === userId);
      
      if (userStoryIndex >= 0) {
        stories[userStoryIndex].stories.push(newStory);
        stories[userStoryIndex].updatedAt = now.toISOString();
      } else {
        stories.push({
          userId,
          stories: [newStory],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
      return newStory;
    } catch (error) {
      console.error('Error creating story:', error);
      return null;
    }
  }

  // Összes story lekérése
  static async getAllStories() {
    try {
      const storiesJson = await AsyncStorage.getItem(STORAGE_KEY);
      const stories = storiesJson ? JSON.parse(storiesJson) : [];
      
      // Töröld a lejárt story-kat
      const now = new Date();
      const validStories = stories
        .map(userStories => ({
          ...userStories,
          stories: userStories.stories.filter(
            story => new Date(story.expiresAt) > now
          ),
        }))
        .filter(userStories => userStories.stories.length > 0);

      // Mentsd el a tisztított listát
      if (validStories.length !== stories.length) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validStories));
      }

      return validStories;
    } catch (error) {
      console.error('Error getting stories:', error);
      return [];
    }
  }

  // Story megtekintése
  static async viewStory(storyId, viewerId) {
    try {
      const stories = await this.getAllStories();
      let updated = false;

      stories.forEach(userStories => {
        userStories.stories.forEach(story => {
          if (story.id === storyId && !story.views.includes(viewerId)) {
            story.views.push(viewerId);
            updated = true;
          }
        });
      });

      if (updated) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
      }

      return updated;
    } catch (error) {
      console.error('Error viewing story:', error);
      return false;
    }
  }

  // Story reakció
  static async reactToStory(storyId, userId, reaction) {
    try {
      const stories = await this.getAllStories();
      let updated = false;

      stories.forEach(userStories => {
        userStories.stories.forEach(story => {
          if (story.id === storyId) {
            const existingReaction = story.reactions.find(r => r.userId === userId);
            if (existingReaction) {
              existingReaction.type = reaction;
            } else {
              story.reactions.push({ userId, type: reaction, timestamp: new Date().toISOString() });
            }
            updated = true;
          }
        });
      });

      if (updated) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
      }

      return updated;
    } catch (error) {
      console.error('Error reacting to story:', error);
      return false;
    }
  }

  // Story törlése
  static async deleteStory(storyId, userId) {
    try {
      const stories = await this.getAllStories();
      
      const updatedStories = stories
        .map(userStories => {
          if (userStories.userId === userId) {
            return {
              ...userStories,
              stories: userStories.stories.filter(s => s.id !== storyId),
            };
          }
          return userStories;
        })
        .filter(userStories => userStories.stories.length > 0);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStories));
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      return false;
    }
  }

  // Felhasználó story-jainak lekérése
  static async getUserStories(userId) {
    try {
      const stories = await this.getAllStories();
      return stories.find(s => s.userId === userId) || null;
    } catch (error) {
      console.error('Error getting user stories:', error);
      return null;
    }
  }

  // Megtekintett story-k követése
  static async markStoriesAsViewed(userId, viewerId) {
    try {
      const stories = await this.getAllStories();
      let updated = false;

      stories.forEach(userStories => {
        if (userStories.userId === userId) {
          userStories.stories.forEach(story => {
            if (!story.views.includes(viewerId)) {
              story.views.push(viewerId);
              updated = true;
            }
          });
        }
      });

      if (updated) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
      }

      return updated;
    } catch (error) {
      console.error('Error marking stories as viewed:', error);
      return false;
    }
  }

  // Időelteltség formázása
  static getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    return '1 napja';
  }

  // Teszt adatok generálása
  static async generateTestStories(profiles) {
    try {
      const testStories = profiles.slice(0, 5).map((profile, index) => ({
        userId: profile.id,
        stories: [
          {
            id: Date.now() + index,
            userId: profile.id,
            image: profile.photo,
            text: index % 2 === 0 ? '🌟 Gyönyörű nap a városban!' : null,
            createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            views: [],
            reactions: [],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(testStories));
      return testStories;
    } catch (error) {
      console.error('Error generating test stories:', error);
      return [];
    }
  }
}

export default StoryService;

