import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import NoteItem from './components/NoteItem';
import Snackbar from './components/Snackbar';

SplashScreen.preventAutoHideAsync(); // keeping the splash screen visible until fonts are loaded

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
  }); // Loads icon fonts
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isNewNote, setIsNewNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const insets = useSafeAreaInsets();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);


  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync(); // hides splash once fonts are loaded
    }
  }, [fontsLoaded]);

  // loads notes from AsyncStorage during initial app launch
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await AsyncStorage.getItem('@my_notes');
        if (savedNotes !== null) {
          setNotes(JSON.parse(savedNotes));
        }
      } catch (e) {
        console.log("Error loading notes", e);
      }
    };
    loadNotes();
  }, []);

  //search function, filters notes based on title and text content
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.text.toLowerCase().includes(query)
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  // function for showing snackbar with a message
  const triggerSnackbar = (msg) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  };

  // save function
  const handleSaveNote = async () => {
    const isEmpty = noteTitle.trim() === '' && noteText.trim() === '';

    // handles empty note
    if (isEmpty) {
      const filteredNotes = notes.filter(note => note.id !== editingNoteId);
      setNotes(filteredNotes);
      await AsyncStorage.setItem('@my_notes', JSON.stringify(filteredNotes));
      exitEditor();
      setTimeout(() => triggerSnackbar("Empty note discarded"), 200);
      return;
    }

    // updates the note in the list and saves to AsyncStorage
    const updatedNotes = notes.map((note) =>
      note.id === editingNoteId
        ? { ...note, title: noteTitle, text: noteText, date: new Date().toLocaleDateString() }
        : note
    );

    try {
      setNotes(updatedNotes);
      await AsyncStorage.setItem('@my_notes', JSON.stringify(updatedNotes));
      exitEditor();
      setTimeout(() => triggerSnackbar(isNewNote ? "Note added" : "Note updated"), 200);
    } catch (e) {
      console.log("Save failed", e);
    }
  };

  // handles back press in editor, checks for unsaved changes and alerts user
  const handleBackPress = () => {
    const isEmpty = noteTitle.trim() === '' && noteText.trim() === '';

    if (isEmpty) {
      // if the note is empty, deletes it and exits
      const filteredNotes = notes.filter(n => n.id !== editingNoteId);
      setNotes(filteredNotes);
      AsyncStorage.setItem('@my_notes', JSON.stringify(filteredNotes));
      exitEditor();
      return;
    }
    // if there are unsaved changes, asks the user to save or discard
    if (hasUnsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "Do you want to save your changes before leaving?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              // If it was a brand new note that was never saved, removes the placeholder
              if (isNewNote) {
                setNotes(notes.filter(n => n.id !== editingNoteId));
              }
              exitEditor();
            }
          },
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: handleSaveNote }
        ]
      );
    } else {
      exitEditor();
    }
  };

  // exits the editor and resets states
  const exitEditor = () => {
    setIsEditing(false);
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteText('');
    setHasUnsavedChanges(false);
  };

  // creates a new note 
  const handleCreateNewNote = () => {
    const newId = Date.now().toString();
    const newNote = {
      id: newId,
      title: '',
      text: '',
      date: new Date().toLocaleDateString()
    };

    // adds the new note to the top of the list
    setNotes([newNote, ...notes]);
    setEditingNoteId(newId);
    setIsNewNote(true);
    setIsEditing(true);
  };

  // handles note deletion with confirmation
  const handleDeleteNote = async (id) => {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    try {
      await AsyncStorage.setItem('@my_notes', JSON.stringify(newNotes));
    } catch (e) {
      console.log("Error saving after delete", e);
    }
    triggerSnackbar("Note deleted");
  };

  // handles deleting notes from the editor with confirmation
  const handleDeleteFromEditor = () => {
    Alert.alert(
      "Delete Note",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            handleDeleteNote(editingNoteId);
            setIsEditing(false);
            setTimeout(() => triggerSnackbar("Note deleted"), 200);

            setEditingNoteId(null);
            setNoteTitle('');
            setNoteText('');
          }
        }
      ]
    );
  };

  // handles editing a note
  const handleEditNote = (item) => {
    setNoteTitle(item.title || '');
    setNoteText(item.text);
    setEditingNoteId(item.id);
    setIsNewNote(false);
    setIsEditing(true);
  };

  // if fonts aren't loaded yet, don't render anything, i.e. keep the splash screen visible
  if (!fontsLoaded) {
    return null;
  }

  // Main screen rendering
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      {/* Editor view */}
      {isEditing && (<SafeAreaView style={styles.editorContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#5F6368" />
          </TouchableOpacity>

          <View style={styles.headerIcons}>
            {/* You can add extra icons here later, like Pin or Archive */}
            <MaterialCommunityIcons
              name="delete"
              size={24}
              color="#5F6368"
              onPress={handleDeleteFromEditor}
            />
            <TouchableOpacity onPress={handleSaveNote} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#999"
            value={noteTitle}
            onChangeText={(text) => {
              setNoteTitle(text);
              setHasUnsavedChanges(true); // Save as they type
            }}
            returnKeyType="next" // Suggests moving to the next field
          />
          <TextInput
            style={styles.fullInput}
            placeholder="Start typing..."
            placeholderTextColor="#999"
            multiline={true}
            autoFocus={!editingNoteId}
            value={noteText}
            onChangeText={(text) => {
              setNoteText(text);
              setHasUnsavedChanges(true); // Save as they type
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>)}

      {/* Main list view */}
      {!isEditing && (<SafeAreaView style={[styles.container, { paddingTop: insets.top * 0.6 }]}>
        <Text style={styles.title}>Notes</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          key={"two-columns"}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <NoteItem
              item={item}
              onDelete={handleDeleteNote}
              onEdit={handleEditNote}
            />
          )}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery.length > 0
                ? `No notes found for "${searchQuery}"`
                : "No notes yet. Tap + to begin."}
            </Text>
          }
        />

        {/* Floating action button */}
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: insets.bottom + 20 }
          ]}
          onPress={handleCreateNewNote}
        >
          <MaterialCommunityIcons name='plus' size={30} color="#fff" />
        </TouchableOpacity>

      </SafeAreaView>)}

      {/* snackbar for showing messages */}
      <Snackbar
        message={snackbarMessage}
        visible={snackbarVisible}
        onHide={() => setSnackbarVisible(false)}
      />
    </View>
  );
}

// Styles for the app
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
    color: '#1A1A1A',
    paddingHorizontal: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: '4%',
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 50,
    fontSize: 16,
  },
  // fab = floating action button
  fab: {
    position: 'absolute',
    right: 25,
    backgroundColor: '#6164f5',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6164f5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Header Styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 5,
  },
  saveBtn: {
    backgroundColor: '#6164f5',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 20,
    paddingRight: 10,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  fullInput: {
    flex: 1,
    padding: 20,
    fontSize: 18,
    lineHeight: 26,
    color: '#2D3436',
    textAlignVertical: 'top',
  },
});