let dbAdmin;

async function initAdmin() {
    dbAdmin = new BloodConnectDatabase();
    await dbAdmin.init();
    showStats();
}

async function showStats() {
    const stats = await dbAdmin.getStatistics();
    document.getElementById('stats').innerHTML = `
        <p>Total Donors: ${stats.totalDonors}</p>
        <p>Lives Saved: ${stats.livesSaved}</p>
        <p>Total Blood Units: ${stats.totalUnits}</p>
    `;
}

function showMessage(msg, isError = false) {
    const messageEl = document.getElementById('message');
    messageEl.innerHTML = `<p class="${isError ? 'error' : 'success'}">${msg}</p>`;
    setTimeout(() => {
        messageEl.innerHTML = '';
    }, 3000);
}

async function exportDatabase() {
    try {
        if (!dbAdmin || !dbAdmin.db) {
            showMessage('Database not initialized', true);
            return;
        }
        
        const data = dbAdmin.db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bloodconnect_backup_${new Date().toISOString().split('T')[0]}.db`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage('Database exported successfully!');
    } catch (error) {
        showMessage('Export failed: ' + error.message, true);
    }
}

async function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const uInt8Array = new Uint8Array(arrayBuffer);
        
        if (!window.SQL) {
            window.SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
        }
        
        dbAdmin.db = new SQL.Database(uInt8Array);
        dbAdmin.saveDatabase();
        showMessage('Database imported successfully!');
        showStats();
        viewAllData();
    } catch (error) {
        showMessage('Import failed: ' + error.message, true);
    }
}

async function resetDatabase() {
    if (confirm('Are you sure you want to reset the database? This will delete all data!')) {
        localStorage.removeItem('bloodconnect_database');
        location.reload();
    }
}

async function viewAllData() {
    try {
        const tables = ['users', 'blood_requests', 'reviews'];
        let html = '';

        for (const table of tables) {
            const stmt = dbAdmin.db.prepare(`SELECT * FROM ${table} LIMIT 50`);
            const data = [];
            
            while (stmt.step()) {
                data.push(stmt.getAsObject());
            }
            stmt.free();

            html += `<h3>${table}</h3>`;
            if (data.length > 0) {
                html += '<table><tr>';
                const headers = Object.keys(data[0]);
                headers.forEach(header => {
                    html += `<th>${header}</th>`;
                });
                html += '</tr>';

                data.forEach(row => {
                    html += '<tr>';
                    headers.forEach(header => {
                        html += `<td>${row[header] || '-'}</td>`;
                    });
                    html += '</tr>';
                });
                html += '</table>';
            } else {
                html += '<p>No data found</p>';
            }
        }

        document.getElementById('dataViewer').innerHTML = html;
    } catch (error) {
        showMessage('Error viewing data: ' + error.message, true);
    }
}

window.addEventListener('load', initAdmin);