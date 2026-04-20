import axios from 'axios';

async function test() {
    try {
        const res = await axios.get('http://localhost:8000/api/stocks/conviction/top?limit=10');
        console.log('Success:', res.data);
    } catch (err) {
        console.log('Error:', err.response?.status, err.message);
    }
}

test();
