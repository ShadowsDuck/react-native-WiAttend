import { db } from "../config/db.js";
import { rooms } from "../db/schema.js";

export async function getAllRooms(req, res) {
  try {
    const allRooms = await db.query.rooms.findMany();

    res.status(200).json(allRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
