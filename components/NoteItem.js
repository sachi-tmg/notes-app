import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NoteItem({ item, onDelete, onEdit }) {

    // handles the press of the three dots button
    const handleMorePress = () => {
        // displays menu like alert for options
        Alert.alert(
            "Note Options",
            "What would you like to do?",
            [
                { text: "Edit", onPress: () => onEdit(item) },
                {
                    text: "Delete",
                    onPress: () => confirmDelete(),
                    style: "destructive"
                },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    // confirmation alert before deleting a note
    const confirmDelete = () => {
        Alert.alert(
            "Delete Note",
            "Are you sure? This cannot be undone.",
            [
                { text: "No", style: "cancel" },
                { text: "Yes, Delete", onPress: () => onDelete(item.id), style: "destructive" }
            ]
        );
    };

    // main render of the note item
    return (
        <TouchableOpacity
            style={styles.noteCard}
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
        >
            {/* header with date and more options button */}
            <View style={styles.cardHeader}>
                <Text style={styles.noteDate}>
                    {item.date ? item.date.split(',')[0] : 'No Date'}
                </Text>

                {/* More Options Button */}
                <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={handleMorePress}
                >
                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#ADADAD" />
                </TouchableOpacity>
            </View>

            {item.title ? (
                <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
            ) : null}

            <Text style={styles.noteText} numberOfLines={item.title ? 3 : 5}>
                {item.text}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    noteCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 15,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        marginBottom: 12,
        minHeight: 140,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    noteTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 16,
        color: '#2D3436',
        lineHeight: 22,
    },
    noteDate: {
        fontSize: 12,
        color: '#bfccd1',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    moreBtn: {
        padding: 5,
        marginRight: -5,
    },
});