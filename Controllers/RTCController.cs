using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webrtc.Controllers
{
    [Route("api/[controller]")]
    public class RTCController : Controller
    {
        private readonly RTCContext _rtcContext;
        public RTCController(RTCContext rtcContext)
        {
            _rtcContext = rtcContext;
        }

        [HttpPost("peer")]
        public async Task<IActionResult> AddPeer([FromBody]PeerDescription peer)
        {
            await _rtcContext.Peers.AddAsync(peer);
            await _rtcContext.SaveChangesAsync();
            return Ok(peer);
        }

        [HttpDelete("peer/{id}")]
        public async Task<IActionResult> DeletePeer(int id)
        {
            var peer = await _rtcContext.Peers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
            if(peer == null)
            {
                return NotFound();
            }
            _rtcContext.Remove(peer);
            await _rtcContext.SaveChangesAsync();
            return Ok(peer.Id);
        }

        [HttpDelete("peer/all/{name}")]
        public async Task<IActionResult> PurgePeers(string name)
        {
            
            _rtcContext.Peers.RemoveRange(_rtcContext.Peers.AsNoTracking().Where(p => p.Name == name));
            await _rtcContext.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("peer")]
        public async Task<IEnumerable<PeerDescription>> GetPeers()
        {
            return await _rtcContext.Peers.AsNoTracking().ToArrayAsync();
        }


        [HttpPost("candidate/{peerId}")]
        public async Task<IActionResult> AddCandidate(int peerId, [FromBody]IceCandidate candidate)
        {
            // var peer = await _rtcContext.Peers.SingleOrDefaultAsync(p => p.Id == peerId);
            // if(peer == null) {
            //     return NotFound();
            // }
            candidate.PeerId = peerId;
            //candidate.Peer = peer;
            await _rtcContext.IceCandidates.AddAsync(candidate);
            await _rtcContext.SaveChangesAsync();
            return Ok(candidate);
        }

        [HttpGet("candidate/{peerId}")]
        public async Task<IEnumerable<IceCandidate>> GetCandidates(int peerId)
        {
            return await _rtcContext.IceCandidates.Where(c => c.PeerId == peerId).ToArrayAsync();
        }
    }
}