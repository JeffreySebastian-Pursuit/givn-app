import axios from "axios"
import { useContext, useState, useEffect } from "react";
import { useHistory } from "react-router-dom"
import { UserContext } from "../Providers/UserProvider";
import { apiURL } from "../util/apiURL";
import Map from "./Map";
import "../Styles/NewForm.css"

const NewForm = () => {
  const {user} = useContext(UserContext);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    address: user ? (user.address == "EARTH" ? "" : user.address) : "",
    longitude: user ? user.longitude : 0,
    latitude: user ? user.latitude : 0,
    created_at: new Date().toDateString(),
    status: "active",
    is_biodegradable: false,
    expiration: 0
  });
  const [images, setImages] = useState([])
  const [categories, setCategories] = useState([])
  const API = apiURL();
  const history = useHistory()

  const handleChange = (e) => {
    setNewItem({ ...newItem, [e.target.id]: e.target.value });
  };

  useEffect(() => {
    const getCategories = async () => {
      try {
        let res = await axios.get(`${API}/categories`)
        setCategories(res.data)
      } catch (error) {
        console.log(error)
      }
    }
    getCategories()
  }, [API])

  async function getURL() {
    const { data } = await axios.get(`${API}/s3url`)
    console.log("inside getURL function")
    console.log(data)
    return data.url;
  }

  const getS3url = async (e) => {
    const file = e.target.files[0]

    //get secure URL from server
    let url = await getURL();
    console.log(url)

    //post image directly to s3 bucket
    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data"
      },
      body: file

    })
    const imageURL = url.split('?')[0]
    console.log(imageURL)

    //post photos to frontend
    setImages([imageURL, ...images])

  }

  const postItem = async () => {
    console.log(newItem)
    try {
      let res = await axios.post(`${API}/users/${user.uid}/items`, newItem);
      return res.data.id
    } catch (error) {
      console.log(error)
    }
  }

  const postPhoto = async (itemID, newPhoto) => {
    try {
      await axios.post(`${API}/items/${itemID}/photos`, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        photo_url: newPhoto
      });
    } catch (error) {
      console.log(error)
    }
  }

  const postPhotos = async (id) => {
    try {
      for (let i = 0; i < images.length; i++) {
        await postPhoto(id, images[i])
      }
    } catch (error) {
      console.log(error)
    }
  }

  const updateLocation = (obj) => {
    setNewItem(prevState => { return { ...prevState, 'address': obj.address, 'longitude': obj.lng, 'latitude': obj.lat } })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!user){
      alert("You must have an account before posting an item")
      history.push("/")
      return;
    }
    if (newItem['longitude'] === 0) {
      alert("Select a address to pick up item")
      return;
    }
    const id = await postItem()
    await postPhotos(id)
    history.push("/posts")
  };

  const categoryOptions = categories.map(category => {
    return <option key={category.id} value={category.name}>{category.name}</option>
  })

  return (
    <div>
      <form className="newForm" onSubmit={handleSubmit}>
        <label htmlFor="title">Post an item: </label>
        <input
          id="title"
          value={newItem.title}
          placeholder="title of item"
          type="text"
          onChange={handleChange}
          required
        />
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={newItem.description}
          placeholder="description"
          type="text"
          onChange={handleChange}
          required
        />

        {/* add "multiple" for multiple selections in select*/}
        <select id="category">
          <option>Select a Category</option>
          {categoryOptions}
        </select>

        <p>Enter location to pick up item:</p>
        <Map updateLocation={updateLocation} />
        <br />
        <br></br>
        <label htmlFor="image">Select Images to upload:</label>
        <input
          id="image"
          placeholder="image"
          type="file"
          accept="image/*"
          onChange={getS3url}
        />
        <div className="prepost-images" >
          {images.map((image, index) => (
            <img className="prepost-image" src={image} key={index} alt="list"></img>
          ))}
        </div>
        <br />


        <br></br>
        <button className="submit-item-form" type="submit">Submit</button>
      </form>
    </div>
  );
};

export default NewForm;
