User

Stores user data.

    Key Fields: id, email, password, name, role

    Optional Fields: phone, profilePicture, refreshToken, resetToken, resetTokenExp

    Relationships:

        Owns multiple notes (notes)

        Has access to shared notes via NoteUser (visibleNotes)

Note

Represents a note created by a user.

    Key Fields: id, title, description, visibility, archived

    Relationships:

        Belongs to one owner (ownerId → User)

        Can be shared with multiple users (NoteUser)

        Can have multiple versions (NoteVersion)

        Can have multiple tags (NoteTag)

NoteUser

Join table for shared notes (many-to-many between User and Note).

    Fields: id, noteId, userId, canEdit

    Unique Constraint: [noteId, userId] ensures a user-note pair is unique.

NoteVersion

Stores historical versions of a note.

    Fields: id, noteId, title, description, visibility, createdBy, tagsSnapshot, isRevertPoint

    Purpose: Enables version control and reverting changes.

    Indexed: By noteId and createdAt for fast retrieval.

Tag

Defines tags that can be applied to notes.

    Fields: id, name (unique)

    Relationship: Linked to notes via NoteTag.

NoteTag

Join table for Note and Tag (many-to-many).

    Fields: id, noteId, tagId

    Unique Constraint: [noteId, tagId] ensures each tag is added only once per note.

Enums

    Role: Defines user roles (USER, ADMIN)

    Visibility: Controls who can see a note (PUBLIC, PRIVATE, CUSTOM)
